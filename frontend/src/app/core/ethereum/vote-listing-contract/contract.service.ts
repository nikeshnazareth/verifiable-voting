import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/range';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/concat';
import 'rxjs/add/observable/from';


import { APP_CONFIG } from '../../../config';
import { VoteCreatedEvent, VoteListingAPI } from './contract.api';
import { Web3Service } from '../web3.service';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { IContractLog } from '../contract.interface';
import { ErrorService } from '../../error-service/error.service';
import { address, uint } from '../type.mappings';
import { ITransactionReceipt } from '../transaction.interface';

export interface IVoteTimeframes {
  registrationDeadline: number;
  votingDeadline: number;
}

export interface IVoteListingContractService {
  deployedVotes$: Observable<address>;

  deployVote$(
    timeframes: IVoteTimeframes,
    paramsHash: string,
    eligibilityContract: address,
    registrationAuthority: address
  ): Observable<ITransactionReceipt>;
}

export const VoteListingContractErrors = {
  network: new Error('Cannot find the VoteListing contract on the blockchain. ' +
    `Ensure MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`),
  voteCreated: new Error('Cannot listen for VoteCreated events on the VoteListing contract. ' +
    'No new contracts will be displayed'),
  eventError: new Error('Unexpected error in the VoteListing contract event stream'),
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
   * @param {IVoteTimeframes} timeframes the unix timestamps of when the vote phases end
   * @param {string} paramsHash the IPFS hash of the vote parameters
   * @param {address} eligibilityContract the contract that determines if an address is eligible to vote
   * @param {address} registrationAuthority the address that can publish the blinded signatures
   * @returns {Observable<ITransactionReceipt>} An observable that emits the receipt when the contract is deployed</br>
   * or an empty observable if there was an error
   */
  deployVote$(timeframes: IVoteTimeframes,
              paramsHash: string,
              eligibilityContract: address,
              registrationAuthority: address): Observable<ITransactionReceipt> {
    return this._contract$
      .map(contract => contract.deploy(
        timeframes.registrationDeadline,
        timeframes.votingDeadline,
        paramsHash,
        eligibilityContract,
        registrationAuthority,
        {from: this.web3Svc.defaultAccount}
      ))
      .switchMap(promise => Observable.fromPromise(promise))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.deployVote, err);
        return Observable.empty();
      });
  }

  /**
   * Notifies the Error Service for every contract address that cannot be retrieved
   * @returns {Observable<address>} The deployed contract addresses (in order) from the VoteListing contract <br/>
   * with null values wherever a contract could not be retrieved (to maintain the correct index)<br/>
   * or an empty observable if the contract cannot be contacted
   */
  get deployedVotes$(): Observable<address> {
    return this._contract$
    // get the deployed contract addresses
      .switchMap(contract =>
        Observable.fromPromise(
          contract.numberOfVotingContracts.call()
            .then(countBN => countBN.toNumber())
            .then(count => Array(count).fill(0).map((_, idx) => idx)) // produce an array of the numbers up to count
            .then(range => range.map(i =>
              contract.votingContracts.call(i)
                .catch(err => {
                  this.errSvc.add(VoteListingContractErrors.contractAddress(i), err);
                  return Promise.resolve(null);
                })
            ))
            .then(reqs => Promise.all(reqs))
        )
          .map(addresses => <address[]> addresses)
          .switchMap(addresses => Observable.from(addresses))
          // add new vote contracts as they are deployed
          .concat(this._voteCreated$)
      )
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.deployedVotes, err);
        return <Observable<string>> Observable.empty();
      });
  }


  /**
   * Uses the truffle build object to find the VoteListing contract on the injected blockchain and
   * emits the result on the return observable before completing
   * Notifies the Error Service if web3 is not injected or the VoteListing contract doesn't exist
   * on the blockchain
   * @returns {Observable<VoteListingAPI>} An observable that emits VoteListing contract and completes  </br>
   * or simply completes (without emitting anything) if there is an error
   * @private
   */
  private _initContract$(): Observable<VoteListingAPI> {
    if (this.web3Svc.currentProvider) {
      const abstraction: ITruffleContractAbstraction = this.contractSvc.wrap(APP_CONFIG.contracts.vote_listing);
      abstraction.setProvider(this.web3Svc.currentProvider);

      return Observable.fromPromise(
        abstraction.deployed()
          .then(contract => <VoteListingAPI> contract)
          .catch(err => {
            this.errSvc.add(VoteListingContractErrors.network, err);
            return null;
          })
      ).filter(contract => contract); // filter out the null value if the VoteListing contract cannot be found

    } else {
      this.errSvc.add(APP_CONFIG.errors.web3, null);
      return Observable.empty();
    }
  }

  /**
   * Listens for VoteCreated events on the VoteListing contract and returns an observable that emits the addresses
   * @returns {Observable<address>} an observable of the new VoteContract addresses
   */
  private _initVoteCreated$(): Observable<address> {
    const log$: EventEmitter<IContractLog> = new EventEmitter<IContractLog>();
    this._contract$
      .map(contract => contract.allEvents())
      .map(events => events.watch((err, log) => {
        if (err) {
          this.errSvc.add(VoteListingContractErrors.eventError, err);
        } else {
          log$.emit(log);
        }
      }))
      .catch(err => {
        this.errSvc.add(VoteListingContractErrors.voteCreated, err);
        return Observable.empty();
      })
      .subscribe(); // this completes immediately so we don't need to unsubscribe

    return log$.filter(log => log.event === VoteCreatedEvent.name)
      .map(log => (<VoteCreatedEvent.Log> log).args.contractAddress);
  }
}

