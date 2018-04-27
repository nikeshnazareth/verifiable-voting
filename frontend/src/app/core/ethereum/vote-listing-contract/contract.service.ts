import { EventEmitter, Injectable } from '@angular/core';

import { APP_CONFIG } from '../../../config';
import { VoteCreatedEvent, VoteListingAPI } from './contract.api';
import { Web3Service } from '../web3.service';
import { TruffleContractWrapperService } from '../truffle-contract.service';
import { IContractEventStream } from '../contract.interface';
import { ErrorService } from '../../error-service/error.service';
import { address, bytes32 } from '../type.mappings';

export interface IVoteListingContractService {
  voteCreated$: EventEmitter<string>;

  deployVote(paramsHash: string): Promise<void>;

  deployedVotes(): Promise<address[]>;
}

@Injectable()
export class VoteListingContractService implements IVoteListingContractService {
  /**
   * A stream of new vote contract addresses deployed from the VoteListing contract
   */
  public voteCreated$: EventEmitter<address>;

  private _initialised: Promise<void>;
  private _contract: VoteListingAPI;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {
    this.voteCreated$ = new EventEmitter<string>();

    this._initialised = this.initialiseContract()
      .then(() => this.emitVoteCreatedEvents())
      .catch(err => this.errSvc.add(err));
  }

  /**
   * Uses the VoteListing contract to deploy a new vote to the blockchain
   * @param {bytes32} paramsHash the IPFS hash of the vote parameters
   * @returns {Promise<void>} A promise indicating when the contract is deployed
   */
  deployVote(paramsHash: bytes32): Promise<void> {
    return this._initialised
      .then(() => this._contract.deploy(paramsHash, {from: this.web3Svc.defaultAccount}))
      .then(tx => null);
  }

  /**
   * @returns {Promise<address[]>} The deployed contract addresses from the VoteListing contract
   */
  deployedVotes(): Promise<address[]> {
    return this._initialised
      .then(() => this._contract.numberOfVotingContracts.call())
      .then(countBN => countBN.toNumber())
      .then(count => Array(count).fill(0).map((_, idx) => idx)) // produce an array of the numbers up to count
      .then(range => range.map(i => this._contract.votingContracts.call(i)))
      .then(reqs => Promise.all(reqs));
  }

  /**
   * Uses the truffle build object to find the VoteListing contract on the injected blockchain
   * and assigns it to this._contract
   * @returns {Promise<void>} A promise indicating when this._contract is initialised (or an error occurs)
   */
  private initialiseContract(): Promise<void> {
    return this.web3Svc.afterInjected()
      .then(() => this.contractSvc.wrap(APP_CONFIG.contracts.vote_listing))
      .then(abstraction => {
        abstraction.setProvider(this.web3Svc.currentProvider);
        return abstraction.deployed();
      })
      .then(contract => {
        this._contract = <VoteListingAPI> contract;
      });
  }

  /**
   * Listens for VoteCreated events on the VoteListing contract and
   * pipes the events to this.voteCreated$
   */
  private emitVoteCreatedEvents(): void {
     const events: IContractEventStream = this._contract.allEvents();
    events.watch((err, log) => {
      if (err) {
        this.errSvc.add(err);
      } else if (log.event === VoteCreatedEvent.name) {
        this.voteCreated$.emit((<VoteCreatedEvent.Log> log).args.contractAddress);
      }
    });
  }
}

