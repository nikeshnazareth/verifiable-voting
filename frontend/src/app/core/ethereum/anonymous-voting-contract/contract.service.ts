import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/take';

import { APP_CONFIG } from '../../../config';
import { Web3Service } from '../web3.service';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { ErrorService } from '../../error-service/error.service';
import { address } from '../type.mappings';
import { AnonymousVotingAPI, NewPhaseEvent, VotePhases } from './contract.api';
import { IContractLog } from '../contract.interface';


export interface IAnonymousVotingContractService {
  contractAt(addr: address): Observable<AnonymousVotingAPI>;

  newPhaseEventsAt$(addr: address): Observable<number>;
}

export const AnonymousVotingContractErrors = {
  network: (addr) => new Error(`Unable to find the AnonymousVoting contract on the blockchain at address ${addr}. ` +
    'Ensure the address is correct ' +
    `and MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`),
  events: (addr) => new Error(`Unexpected error in the event stream of the AnonymousVoting contract at ${addr}`),
  paramsHash: (addr) => new Error(`Unable to retrieve the parameters hash from the AnonymousVoting contract at ${addr}`)
};

@Injectable()
export class AnonymousVotingContractService implements IAnonymousVotingContractService {
  private _abstraction$: Observable<ITruffleContractAbstraction>;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {

    this._abstraction$ = this._initContractAbstraction();
  }

  /**
   * Creates an observable of NewPhase events on the specified AnonymousVoting contract
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<number>} the stream of phases
   */
  newPhaseEventsAt$(addr: address): Observable<number> {
    return this.eventsAt$(addr)
      .filter(log => log.event === NewPhaseEvent.name)
      .map(log => (<NewPhaseEvent.Log> log).args.phase.toNumber())
      .take(VotePhases.length - 1); // stop after the final phase
  }

  /**
   * Creates an observable of events on the specified AnonymousVoting contract
   * Notifies the Error Service if there is no contract at the specified address
   * or if the contract event stream contains errors
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<IContractLog>} the stream of contract events<br/>
   * or an empty observable if there was an error
   */
  private eventsAt$(addr: address): Observable<IContractLog> {
    return this._abstraction$
      .map(abstraction => abstraction.at(addr))
      .switchMap(contractPromise => Observable.fromPromise(contractPromise))
      .map(contract => contract.allEvents())
      .switchMap(events => <Observable<IContractLog>> Observable.create(observer => {
        events.watch((err, log) => err ?
          this.errSvc.add(AnonymousVotingContractErrors.events(addr), err) :
          observer.next(log)
        );
        return () => events.stopWatching();
      }))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.network(addr), err);
        return <Observable<IContractLog>> Observable.empty();
      });
  }

  /**
   * Finds the AnonymousVoting contract at the specified address and returns an AnonymousVotingContract
   * object to interact with it
   * It notifies the Error Service if there is no AnonymousVoting contract at the specified address
   * @param {address} addr the address of the contract
   * @returns {Observable<AnonymousVotingContract>} An observable of the contract object<br/>
   * or the equivalent of Observable.empty() if the contract cannot be found
   */
  contractAt(addr: address): Observable<AnonymousVotingAPI> {
    return this._abstraction$
      .switchMap(abstraction => Observable.fromPromise(
        abstraction.at(addr)
          .then(contract => <AnonymousVotingAPI> contract)
          .catch(err => {
            this.errSvc.add(AnonymousVotingContractErrors.network(addr), err);
            return null;
          })
      ))
      .filter(abstraction => abstraction); // filter out the null value (if the contract could not be found)
  }

  /**
   * Uses the truffle build object to create a truffle abstraction of the AnonymousVoting contract
   * It notifies the Error Service if web3 is not injected
   * @returns {Observable<ITruffleContractAbstraction>} (an Observable of) the truffle abstraction</br>
   * of the AnonymousVoting contract or Observable.empty() if web3 is not injected
   * @private
   */
  private _initContractAbstraction(): Observable<ITruffleContractAbstraction> {
    if (this.web3Svc.currentProvider) {
      const abstraction: ITruffleContractAbstraction = this.contractSvc.wrap(APP_CONFIG.contracts.anonymous_voting);
      abstraction.setProvider(this.web3Svc.currentProvider);
      return Observable.of(abstraction);
    } else {
      this.errSvc.add(APP_CONFIG.errors.web3, null);
      return Observable.empty();
    }
  }
}

