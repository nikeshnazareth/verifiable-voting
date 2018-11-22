import 'rxjs/add/observable/from';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/reduce';
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
  registrationHashes$: Observable<Observable<IRegistrationHashes>>;
  voteHashes$: Observable<IVoteHash>;

  register$(voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt>;

  completeRegistration$(voterAddr: address, blindSignatureHash: string, registrationAuthority: address): Observable<ITransactionReceipt>;

  vote$(anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt>;
}

export class AnonymousVotingContractManager implements IAnonymousVotingContractManager {
  private events$: ReplaySubject<IContractLog>;
  private voteConstants$: ReplaySubject<IVoteConstants>;
  private regHashes$: ReplaySubject<ReplaySubject<IRegistrationHashes>>;

  constructor(private contract$: Observable<AnonymousVotingAPI>, private errSvc: ErrorService) {
    this.events$ = new ReplaySubject<IContractLog>();
    this.voteConstants$ = new ReplaySubject<IVoteConstants>();
    this.regHashes$ = new ReplaySubject<ReplaySubject<IRegistrationHashes>>();

    // Replace the observables with Replay Subjects
    this.initEvents$().subscribe(this.events$);
    this.initVoteConstants$().subscribe(this.voteConstants$);
    this.initRegistrationHashes$().subscribe(obs => {
      const record$ = new ReplaySubject<IRegistrationHashes>();
      obs.subscribe(record$);
      this.regHashes$.next(record$);
    });
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
   * @returns {Observable<Observable<IRegistrationHashes>>} An observable of the registration IPFS hashes as they are published.
   * Each item is an observable of the two registration steps per voter:
   * 1. The partial record after the VoterInitiatedRegistration event (ie. unknown (null) blind signature hash)
   * 2. The full record
   */
  get registrationHashes$(): Observable<Observable<IRegistrationHashes>> {
    return this.regHashes$;
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
   * @returns an observable of the IPFS Registration hashes as they are published,
   * where each item corresponds to a single voter and is an observable of the two relevant events
   * (the voter initiated registration and the registration authority completed the registration)
   * @private
   */
  private initRegistrationHashes$(): Observable<Observable<IRegistrationHashes>> {
    return this.events$
      .filter(log => log.event === VoterInitiatedRegistration.name)
      .map(log => (<VoterInitiatedRegistration.Log> log).args)
      .map(initiatedEventArgs =>
        Observable.of({
          voter: initiatedEventArgs.voter,
          blindedAddressHash: initiatedEventArgs.blindedAddressHash,
          blindSignatureHash: null
        }).concat(
          this.events$.filter(log => log.event === RegistrationComplete.name)
            .map(log => (<RegistrationComplete.Log> log).args)
            .filter(completeEventArgs => completeEventArgs.voter === initiatedEventArgs.voter)
            .take(1)
            .map(completeEventArgs => ({
              voter: initiatedEventArgs.voter,
              blindedAddressHash: initiatedEventArgs.blindedAddressHash,
              blindSignatureHash: completeEventArgs.signatureHash
            }))
        )
      );
  }
}

export interface IRegistrationHashes {
  voter: string;
  blindedAddressHash: string;
  blindSignatureHash: string;
}
