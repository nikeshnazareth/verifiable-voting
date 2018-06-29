import 'rxjs/add/observable/from';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/reduce';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { ErrorService } from '../../error-service/error.service';
import { IVoteHash } from '../../ipfs/formats.interface';
import { IContractLog } from '../contract.interface';
import { ITransactionReceipt } from '../transaction.interface';
import { address } from '../type.mappings';
import { IVoteConstants } from '../vote-listing-contract/contract.service';
import { AnonymousVotingContractErrors } from './contract-errors';
import { RegistrationComplete, VoterInitiatedRegistration, VoteSubmitted } from './contract-events.interface';
import { AnonymousVotingAPI } from './contract.api';

export interface IAnonymousVotingContractManager {
  phase$: Observable<number>;
  constants$: Observable<IVoteConstants>;
  registrationHashes$: Observable<IRegistrationHashes>;
  voteHashes$: Observable<IVoteHash>;

  register$(voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt>;

  completeRegistration$(voterAddr: address, blindSignatureHash: string, registrationAuthority: address): Observable<ITransactionReceipt>;

  vote$(anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt>;
}

export class AnonymousVotingContractManager implements IAnonymousVotingContractManager {
  private events$: ReplaySubject<IContractLog>;
  private voteConstants$: ReplaySubject<IVoteConstants>;
  private registrationHashes: IRegistrationHashes;
  private updatedRegistrationHashes$: BehaviorSubject<boolean>;

  constructor(private contract$: Observable<AnonymousVotingAPI>, private errSvc: ErrorService) {
    this.events$ = new ReplaySubject<IContractLog>();
    this.voteConstants$ = new ReplaySubject<IVoteConstants>();
    this.updatedRegistrationHashes$ = new BehaviorSubject<boolean>(true);

    this.initEvents$().subscribe(this.events$);
    this.initVoteConstants$().subscribe(this.voteConstants$);
    this.initRegistrationHashes();
  }

  /**
   * Determines the phase based on the current time and the phase deadlines
   * (note the phase variable in the contract may be obsolete, since it won't update until there is a transaction)
   * @returns {Observable<number>} An observable of the current phase
   */
  get phase$(): Observable<number> {
    const now: number = (new Date()).getTime();
    return this.constants$
    // map deadlines to the delay until that deadline (from the previous delay)
      .map(constants => [
        0,
        Math.max(constants.registrationDeadline - now, 0),
        Math.min(Math.max(constants.votingDeadline - now, 0), constants.votingDeadline - constants.registrationDeadline)
      ])
      .switchMap(delays => Observable.from(delays))
      // the phase is the index in the array
      .concatMap((delay, phase) => Observable.timer(delay).map(() => phase));
  }

  /**
   * @returns {Observable<IVoteConstants>} An observable of the vote constants <br/>
   * or an empty observable if there is an error
   */
  get constants$(): Observable<IVoteConstants> {
    return this.voteConstants$;
  }

  /**
   * @returns {Observable<IRegistrationHashes>} An observable of the registration IPFS hashes as they are published
   */
  get registrationHashes$(): Observable<IRegistrationHashes> {
    return this.updatedRegistrationHashes$
      .map(() => this.registrationHashes);
  }

  /**
   * @returns {Observable<IVoteHash>} An observable of voters and their vote IPFS hashes as they are published
   */
  get voteHashes$(): Observable<IVoteHash> {
    return this.events$
      .filter(log => log.event === VoteSubmitted.name)
      .map(log => (<VoteSubmitted.Log> log).args);
  }

  /**
   * Uses the AnonymousVoting contract to register the specified voter's blinded address hash
   * @param {address} voterAddr the public address of the voter
   * @param {string} blindAddressHash the IPFS hash of the voter's blinded anonymous address
   * @returns {Observable<ITransactionReceipt>} an observable that emits the receipt when the voter's registration <br/>
   * request is published or an empty observable if there was an error
   */
  register$(voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt> {
    return this.contract$
      .map(contract => contract.register(blindAddressHash, {from: voterAddr}))
      .switchMap(registerPromise => Observable.fromPromise(registerPromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.registration, err);
        return <Observable<ITransactionReceipt>> Observable.empty();
      });
  }

  /**
   * Uses the AnonymousVoting contract to complete the registration for the specified voter
   * @param {address} voterAddr the public address of the voter
   * @param {string} blindSignatureHash the IPFS hash of the signed blinded anonymous address (created by the Registration Authority)
   * @param {address} registrationAuthority an observable that emits the receipt when the blind signature is published
   * or an empty observable if there was an error
   * @returns {Observable<ITransactionReceipt>}
   */
  completeRegistration$(voterAddr: address, blindSignatureHash: string, registrationAuthority: address): Observable<ITransactionReceipt> {
    return this.contract$
      .map(contract => contract.completeRegistration(voterAddr, blindSignatureHash, {from: registrationAuthority}))
      .switchMap(completeRegPromise => Observable.fromPromise(completeRegPromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.completeRegistration, err);
        return <Observable<ITransactionReceipt>> Observable.empty();
      });
  }


  /**
   * Uses the AnonymousVoting contract to vote from the specified address
   * @param {address} anonymousAddr the anonymous address of the voter
   * @param {string} voteHash the IPFS hash of the voter's vote and proof of registration
   * @returns {Observable<ITransactionReceipt>} an observable that emits the receipt when the vote is cast </br>
   * or an empty observable if there was an error
   */
  vote$(anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt> {
    return this.contract$
      .map(contract => contract.vote(voteHash, {from: anonymousAddr}))
      .switchMap(votePromise => Observable.fromPromise(votePromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.vote, err);
        return <Observable<ITransactionReceipt>> Observable.empty();
      });
  }

  /**
   * Creates an (ongoing) observable of the events since the contract was created
   * Notifies the Error Service if the contract event stream contains errors
   * @returns {Observable<IContractLog>} the stream of contract events. Closes when there is an error
   */
  private initEvents$(): Observable<IContractLog> {
    return this.contract$
      .map(contract => contract.allEvents({fromBlock: 0, toBlock: 'latest'}))
      .switchMap(events => <Observable<IContractLog>> Observable.create(observer => {
        events.watch((err, log) => err ?
          this.errSvc.add(AnonymousVotingContractErrors.events, err) :
          observer.next(log)
        );
        return () => events.stopWatching();
      }));
  }

  /**
   * Retrieves the parameters hash from the AnonymousVoting contract
   * @returns {Observable<string>} An observable that emits the constants and completes<br/>
   * or an empty observable if there was an error
   * @private
   */
  private initVoteConstants$(): Observable<IVoteConstants> {
    return this.contract$
      .map(contract => Promise.all([
        contract.parametersHash.call(),
        contract.eligibilityContract.call(),
        contract.registrationAuthority.call(),
        contract.registrationDeadline.call(),
        contract.votingDeadline.call()
      ]))
      .switchMap(promise => Observable.fromPromise(promise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.constants, err);
        return Observable.empty();
      })
      .map(arr => ({
        paramsHash: arr[0],
        eligibilityContract: arr[1],
        registrationAuthority: arr[2],
        registrationDeadline: arr[3].toNumber(),
        votingDeadline: arr[4].toNumber()
      }));
  }

  /**
   * Caches the registration IPFS hashes as they are published and triggers an observable
   * so observers know about the update
   * @private
   */
  private initRegistrationHashes(): void {
    this.registrationHashes = {};
    this.events$
      .filter(log => [VoterInitiatedRegistration.name, RegistrationComplete.name].includes(log.event))
      .subscribe(log => {
        if (log.event === VoterInitiatedRegistration.name) {
          const args = (<VoterInitiatedRegistration.Log> log).args;
          this.registrationHashes[args.voter] = {
            blindedAddress: args.blindedAddressHash,
            signature: null
          };
        } else {
          const args = (<RegistrationComplete.Log> log).args;
          this.registrationHashes[args.voter].signature = args.signatureHash;
        }
        this.updatedRegistrationHashes$.next(true);
      });
  }
}

export interface IRegistrationHashes {
  [voter: string]: {
    blindedAddress: string;
    signature: string;
  };
}
