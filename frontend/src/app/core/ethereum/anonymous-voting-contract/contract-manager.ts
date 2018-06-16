import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/reduce';

import { AnonymousVotingAPI, RegistrationComplete, VoterInitiatedRegistration, VoteSubmitted } from './contract.api';
import { IContractLog } from '../contract.interface';
import { ErrorService } from '../../error-service/error.service';
import { IVoteConstants } from '../vote-listing-contract/contract.service';
import { address } from '../type.mappings';

export interface IRegistrationHashes {
  [voter: string]: {
    blindedAddress: string;
    signature: string;
  };
}

export interface IVoteHash {
  voter: address;
  voteHash: string;
}

export interface IAnonymousVotingContractManager {
  phase$: Observable<number>;
  constants$: Observable<IVoteConstants>;
  registrationHashes$: Observable<IRegistrationHashes>;
  voteHashes$: Observable<IVoteHash>;
}

export const AnonymousVotingContractManagerErrors = {
  events: new Error('Unexpected error in the event stream of an AnonymousVoting contract'),
  constants: new Error('Unable to retrieve the defining constants from the AnonymousVoting contract'),
};

export class AnonymousVotingContractManager implements IAnonymousVotingContractManager {
  private _events$: ReplaySubject<IContractLog>;
  private _voteConstants$: ReplaySubject<IVoteConstants>;
  private _registrationHashes: IRegistrationHashes;
  private _updatedRegistrationHashes$: BehaviorSubject<boolean>;

  constructor(private _contract$: Observable<AnonymousVotingAPI>, private errSvc: ErrorService) {
    this._events$ = new ReplaySubject<IContractLog>();
    this._voteConstants$ = new ReplaySubject<IVoteConstants>();
    this._updatedRegistrationHashes$ = new BehaviorSubject<boolean>(false);

    this._initEvents$().subscribe(this._events$);
    this._initVoteConstants$().subscribe(this._voteConstants$);
    this._initRegistrationHashes();
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
    return this._voteConstants$;
  }

  /**
   * @returns {Observable<IRegistrationHashes>} An observable of the registration IPFS hashes as they are published
   */
  get registrationHashes$(): Observable<IRegistrationHashes> {
    return this._updatedRegistrationHashes$
      .map(() => this._registrationHashes);
  }

  /**
   * @returns {Observable<IVoteHash>} An observable of voters and their vote IPFS hashes as they are published
   */
  get voteHashes$(): Observable<IVoteHash> {
    return this._events$
      .filter(log => log.event === VoteSubmitted.name)
      .map(log => (<VoteSubmitted.Log> log).args);
  }

  /**
   * Creates an (ongoing) observable of the events since the contract was created
   * Notifies the Error Service if the contract event stream contains errors
   * @returns {Observable<IContractLog>} the stream of contract events. Closes when there is an error
   */
  private _initEvents$(): Observable<IContractLog> {
    return this._contract$
      .map(contract => contract.allEvents({fromBlock: 0, toBlock: 'latest'}))
      .switchMap(events => <Observable<IContractLog>> Observable.create(observer => {
        events.watch((err, log) => err ?
          this.errSvc.add(AnonymousVotingContractManagerErrors.events, err) :
          observer.next(log)
        );
        return () => events.stopWatching();
      }));
  }

  /**
   * Retrieves the parameters hash from the AnonymousVoting contract
   * @returns {Observable<string>} An observable that emits the hash and completes<br/>
   * or an empty observable if there was an error
   * @private
   */
  private _initVoteConstants$(): Observable<IVoteConstants> {
    return this._contract$
      .map(contract => Promise.all([
        contract.parametersHash.call(),
        contract.eligibilityContract.call(),
        contract.registrationAuthority.call(),
        contract.registrationDeadline.call(),
        contract.votingDeadline.call()
      ]))
      .switchMap(promise => Observable.fromPromise(promise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractManagerErrors.constants, err);
        return <Observable<IVoteConstants>> Observable.empty();
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
  private _initRegistrationHashes(): void {
    this._registrationHashes = {};
    this._events$
      .filter(log => [VoterInitiatedRegistration.name, RegistrationComplete.name].includes(log.event))
      .subscribe(log => {
        if (log.event === VoterInitiatedRegistration.name) {
          const args = (<VoterInitiatedRegistration.Log> log).args;
          this._registrationHashes[args.voter] = {
            blindedAddress: args.blindedAddressHash,
            signature: null
          };
        } else {
          const args = (<RegistrationComplete.Log> log).args;
          this._registrationHashes[args.voter].signature = args.signatureHash;
        }
        this._updatedRegistrationHashes$.next(true);
      });
  }
}
