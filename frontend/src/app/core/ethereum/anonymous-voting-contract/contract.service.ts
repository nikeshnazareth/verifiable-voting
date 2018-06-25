import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { APP_CONFIG } from '../../../config';
import { ErrorService } from '../../error-service/error.service';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { address } from '../type.mappings';
import { Web3Service } from '../web3.service';
import { AnonymousVotingContractErrors } from './contract-errors';
import { AnonymousVotingContractManager, IAnonymousVotingContractManager } from './contract-manager';
import { AnonymousVotingAPI } from './contract.api';


export interface IAnonymousVotingContractService {
  at(addr: address): IAnonymousVotingContractManager;
}

@Injectable()
export class AnonymousVotingContractService implements IAnonymousVotingContractService {
  private abstraction$: Observable<ITruffleContractAbstraction>;
  private contractCache: IContractCache;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {

    this.abstraction$ = this.initContractAbstraction();
    this.contractCache = {};
  }

  /**
   * Creates (or retrieves from cache) and returns an AnonymousVotingContractManager object for the specified contract
   * @param {address} addr the AnonymousVoting contract address
   * @returns {IAnonymousVotingContractManager} an object to interact with the specified contract
   */
  at(addr: address): IAnonymousVotingContractManager {
    if (!this.contractCache[addr]) {
      this.contractCache[addr] = new AnonymousVotingContractManager(this.contractAt(addr), this.errSvc);
    }
    return this.contractCache[addr];
  }

  /**
   * Uses the truffle build object to create a truffle abstraction of the AnonymousVoting contract
   * It notifies the Error Service if web3 is not injected
   * @returns {Observable<ITruffleContractAbstraction>} (an Observable of) the truffle abstraction</br>
   * of the AnonymousVoting contract or Observable.empty() if web3 is not injected
   * @private
   */
  private initContractAbstraction(): Observable<ITruffleContractAbstraction> {
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
  private contractAt(addr: address): Observable<AnonymousVotingAPI> {
    return this.abstraction$
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


