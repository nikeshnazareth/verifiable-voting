import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/never';

import { APP_CONFIG } from '../../../config';
import { VoteCreatedEvent, VoteListingAPI } from './contract.api';
import { Web3Service } from '../web3.service';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract.service';
import { IContractLog } from '../contract.interface';
import { ErrorService } from '../../error-service/error.service';
import { address, bytes32, uint } from '../type.mappings';
import { ITransactionReceipt } from '../transaction.interface';

export interface IVoteListingContractService {
  deployedVotes$: Observable<address[]>;

  deployVote(paramsHash: bytes32): Observable<ITransactionReceipt>;
}

export const VoteListingContractErrors = {
  web3: new Error('No web3 provider found. Please install the MetaMask extension'),
  network: new Error('Cannot find the VoteListing contract on the blockchain. ' +
    `Ensure MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`),
  voteCreated: new Error('Cannot listen for VoteCreated events on the VoteListing contract. ' +
    'No new contracts will be displayed'),
  deployVote: new Error('Unable to deploy a new AnonymousVoting contract'),
  deployedVotes: new Error('Unable to obtain AnonymousVoting contracts from the VoteListing contract'),
  contractAddress: (i: uint) => new Error(`Unable to retrieve voting contract ${i} (0-up indexing)`)
};

@Injectable()
export class VoteListingContractService implements IVoteListingContractService {
  private _contract$: Observable<VoteListingAPI>;
  private _voteCreated$: Observable<address>;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {

    this._contract$ = this._initContract$();
    this._voteCreated$ = this._initVoteCreated$();
  }

  /**
   * Uses the VoteListing contract to deploy a new vote to the blockchain
   * @param {bytes32} paramsHash the IPFS hash of the vote parameters
   * @returns {Observable<ITransactionReceipt>} An observable that emits the receipt when the contract is deployed
   */
  deployVote(paramsHash: bytes32): Observable<ITransactionReceipt> {
    return this._contract$
      .map(contract => contract.deploy(paramsHash, {from: this.web3Svc.defaultAccount}))
      .switchMap(promise => Observable.fromPromise(promise))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.deployVote);
        // Observable.empty may be misleading because consumers might assume any response
        // implies success - they shouldn't have to check the receipt if they don't care about it
        return Observable.never();
      });
  }

  /**
   * @returns {Observable<address[]>} The deployed contract addresses from the VoteListing contract
   */
  get deployedVotes$(): Observable<address[]> {
    return this._contract$
    // get the deployed contract addresses
      .switchMap(contract => Observable.fromPromise(
        contract.numberOfVotingContracts.call()
          .then(countBN => countBN.toNumber())
          .then(count => Array(count).fill(0).map((_, idx) => idx)) // produce an array of the numbers up to count
          .then(range => range.map(i =>
            contract.votingContracts.call(i)
              .catch(err => {
                this.errSvc.add(VoteListingContractErrors.contractAddress(i));
                return Promise.resolve(null);
              })
          ))
          .then(reqs => Promise.all(reqs))
          .then(addresses => <address[]> addresses.filter(el => el)) // filter out null elements
      ))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.deployedVotes);
        return Observable.of(<address[]> []);
      })
      // add new vote contracts as they are deployed
      .concat(this._voteCreated$.map(addr => [addr]))
      // combine all address arrays into a single array
      .scan((arr0, arr1) => arr0.concat(arr1), []);
  }

  /**
   * Uses the truffle build object to find the VoteListing contract on the injected blockchain and
   * emits the result on this._contract$
   * It notifies the Error Service if web3 is not injected
   */
  private _initContract$(): Observable<VoteListingAPI> {

    if (this.web3Svc.currentProvider) {
      const abstraction: ITruffleContractAbstraction = this.contractSvc.wrap(APP_CONFIG.contracts.vote_listing);
      abstraction.setProvider(this.web3Svc.currentProvider);
      // Observable.fromPromise won't let the outer observable catch the errors so I'm catching them on
      // the promise and letting the error produce a null value
      // TODO: find a better way

      return Observable.fromPromise(
        abstraction.deployed()
          .then(contract => <VoteListingAPI> contract)
          .catch(err => {
              this.errSvc.add(VoteListingContractErrors.network);
              return null;
            }
          )
      );
    } else {
      this.errSvc.add(VoteListingContractErrors.web3);
      return Observable.of(null); // to be consistent with the other path. See the (TODO) above
    }
  }

  /**
   * Listens for VoteCreated events on the VoteListing contract and returns an observable that emits the addresses
   * @returns {Observable<address>} an observable of the new VoteContract addresses
   */
  private _initVoteCreated$(): Observable<address> {
    const log$: EventEmitter<IContractLog> = new EventEmitter<IContractLog>();
    const sub = this._contract$
      .map(contract => contract.allEvents())
      .map(events => events.watch((err, log) => {
        if (err) {
          this.errSvc.add(err);
        } else {
          log$.emit(log);
        }
      }))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.voteCreated);
        return Observable.empty();
      })
      .subscribe(); // this completes immediately so we don't need to unsubscribe

    return log$.filter(log => log.event === VoteCreatedEvent.name)
      .map(log => (<VoteCreatedEvent.Log> log).args.contractAddress);
  }
}

