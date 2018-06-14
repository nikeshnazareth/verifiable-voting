import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { Web3Service } from '../web3.service';
import { ErrorService } from '../../error-service/error.service';
import { APP_CONFIG } from '../../../config';
import { AnonymousVotingContractManager, IAnonymousVotingContractManager } from './contract-state';
import { address } from '../type.mappings';
import { AnonymousVotingAPI } from './contract.api';


export interface IReplacementAnonymousVotingContractService {
  at(addr: address): IAnonymousVotingContractManager;
}

export const AnonymousVotingContractErrors = {
  network: (addr) => new Error(`Unable to find the AnonymousVoting contract on the blockchain at address ${addr}. ` +
    'Ensure the address is correct ' +
    `and MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`)
};

@Injectable()
export class ReplacementAnonymousVotingContractService implements IReplacementAnonymousVotingContractService {
  private _abstraction$: Observable<ITruffleContractAbstraction>;
  private _contractCache: IContractCache;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {

    this._abstraction$ = this._initContractAbstraction();
    this._contractCache = {};
  }

  /**
   * Creates (or retrieves from cache) and returns an AnonymousVotingContractManager object for the specified contract
   * @param {address} addr the AnonymousVoting contract address
   * @returns {IAnonymousVotingContractManager} an object to interact with the specified contract
   */
  at(addr: address): IAnonymousVotingContractManager {
    if (!this._contractCache[addr]) {
      this._contractCache[addr] = new AnonymousVotingContractManager(this._contractAt(addr));
    }
    return this._contractCache[addr];
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

  /**
   * Finds the AnonymousVoting contract and returns an AnonymousVotingContract object to interact with it
   * It notifies the Error Service if there is no AnonymousVoting contract at the specified address
   * @param {address} addr the address of the contract
   * @returns {Observable<AnonymousVotingContract>} An observable of the contract object<br/>
   * or the equivalent of Observable.empty() if the contract cannot be found
   */
  private _contractAt(addr: address): Observable<AnonymousVotingAPI> {
    return this._abstraction$
      .map(abstraction => abstraction.at(addr))
      .switchMap(contractPromise => Observable.fromPromise(contractPromise))
      .map(contract => <AnonymousVotingAPI> contract)
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.network(addr), err);
        return <Observable<AnonymousVotingAPI>> Observable.empty();
      });
  }
}

interface IContractCache {
  [addr: string]: IAnonymousVotingContractManager;
}
