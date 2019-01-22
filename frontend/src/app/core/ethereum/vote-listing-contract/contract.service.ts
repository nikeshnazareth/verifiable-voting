import { Injectable } from '@angular/core';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/range';
import 'rxjs/add/operator/bufferCount';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switch';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { APP_CONFIG } from '../../../config';
import { ErrorService } from '../../error-service/error.service';
import { IContractLog } from '../contract.interface';
import { ITransactionReceipt } from '../transaction.interface';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { address } from '../type.mappings';
import { Web3Errors } from '../web3-errors';
import { Web3Service } from '../web3.service';
import { VoteListingContractErrors } from './contract-errors';
import { VoteCreatedEvent } from './contract-events.interface';
import { VoteListingAPI } from './contract.api';


export interface IVoteConstants {
  paramsHash: string;
  eligibilityContract: address;
  registrationAuthority: address;
  registrationDeadline: number;
  votingDeadline: number;
}

export interface IVoteListingContractService {
  deployedVotes$: Observable<address>;

  deployVote$(voteConstants: IVoteConstants): Observable<ITransactionReceipt>;
}

@Injectable()
export class VoteListingContractService implements IVoteListingContractService {
  public deployedVotes$: ReplaySubject<address>;

  private contractPromise: Promise<VoteListingAPI>;
  private voteCreated$: Observable<address>;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {

    this.contractPromise = this.initContractPromise();

    this.voteCreated$ = this.initVoteCreated$();
    this.deployedVotes$ = new ReplaySubject<address>();
    this.initDeployedVotes$().subscribe(this.deployedVotes$);
  }

  /**
   * Uses the VoteListing contract to deploy a new vote to the blockchain
   * @param {IVoteConstants} voteConstants constant values required to define the vote
   * @returns {Observable<ITransactionReceipt>} An observable that emits the receipt when the contract is deployed</br>
   * or an empty observable if there was an error
   */
  deployVote$(voteConstants: IVoteConstants): Observable<ITransactionReceipt> {
    return this.web3Svc.defaultAccount$
      .switchMap(account => {
        if (typeof account === 'undefined' || account === null) {
          this.errSvc.add(Web3Errors.account, null);
          return Observable.empty();
        } else {
          return Observable.fromPromise(
            this.contractPromise.then(contract => contract.deploy(
              voteConstants.registrationDeadline,
              voteConstants.votingDeadline,
              voteConstants.paramsHash,
              voteConstants.eligibilityContract,
              voteConstants.registrationAuthority,
              {from: account}
            ))
          )
            .catch(err => {
              this.errSvc.add(VoteListingContractErrors.deployVote, err);
              return Observable.empty();
            });
        }
      });
  }

  /**
   * Notifies the Error Service for every contract address that cannot be retrieved
   * @returns {Observable<address>} The deployed contract addresses (in order) from the VoteListing contract <br/>
   * with null values wherever a contract could not be retrieved (to maintain the correct index)<br/>
   * or an empty observable if the contract cannot be contacted
   */
  private initDeployedVotes$(): Observable<address> {
    return this.voteCreated$
      .startWith(null)
      // get the number of votes every time a VoteCreated event is emitted
      .map(() => this.contractPromise.then(contract => contract.numberOfVotingContracts.call()))
      .switchMap(promise => Observable.fromPromise(promise))
      // produce an observable with all the indices not yet processed
      .map(countBN => countBN.toNumber())
      .startWith(0)
      .bufferCount(2, 1)
      .concatMap(bounds => Observable.range(bounds[0], bounds[1] - bounds[0]))
      // get the contract address at the index or null if there is an error
      .map(contractIdx => this.contractPromise
        .then(contract => contract.votingContracts.call(contractIdx))
        .catch(err => {
          this.errSvc.add(VoteListingContractErrors.contractAddress(contractIdx), err);
          return Promise.resolve(null);
        })
      )
      .concatMap(promise => Observable.fromPromise(promise))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.deployedVotes, err);
        return <Observable<address>>Observable.empty();
      });
  }


  /**
   * Uses the truffle build object to find the VoteListing contract on the injected blockchain and
   * emits the result on the return observable before completing
   * Notifies the Error Service if web3 is not injected or the VoteListing contract doesn't exist
   * on the blockchain
   * @returns {Promise<VoteListingAPI>} A promise of the VoteListing contract </br>
   * or null if there is an error
   * @private
   */
  private initContractPromise(): Promise<VoteListingAPI> {
    if (this.web3Svc.currentProvider) {
      const abstraction: ITruffleContractAbstraction = this.contractSvc.wrap(APP_CONFIG.contracts.vote_listing);
      abstraction.setProvider(this.web3Svc.currentProvider);

      return abstraction.deployed()
        .then(contract => <VoteListingAPI>contract)
        .catch(err => {
          this.errSvc.add(VoteListingContractErrors.network, err);
          return null;
        });
    } else {
      this.errSvc.add(APP_CONFIG.errors.web3, null);
      return Promise.resolve(null);
    }
  }

  /**
   * Listens for VoteCreated events on the VoteListing contract and returns an observable that emits the addresses
   * @returns {Observable<address>} an observable of the new VoteContract addresses
   */
  private initVoteCreated$(): Observable<address> {
    const p: Promise<Observable<IContractLog>> = this.contractPromise
      .then(contract => contract.allEvents())
      .then(events => Observable.create(observer => {
        events.watch((err, log) => err ?
          this.errSvc.add(VoteListingContractErrors.eventError, err) :
          observer.next(log)
        );
        return () => events.stopWatching();
      }))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.voteCreated, err);
        return Observable.empty();
      });

    return Observable.fromPromise(p).switch()
      .filter(log => log.event === VoteCreatedEvent.name)
      .map(log => (<VoteCreatedEvent.Log>log).args.contractAddress);
  }
}

