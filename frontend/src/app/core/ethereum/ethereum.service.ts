import { Injectable } from '@angular/core';
import * as contract from 'truffle-contract';

import { APP_CONFIG } from '../../config';
import { IVoteListingContract } from './voteListing.contract.interface';
import { Web3Service } from './web3.service';


export interface IEthereumService {
  deployVote(paramsHash: string): any;
}


@Injectable()
export class EthereumService implements IEthereumService {

  private _voteListingContractPromise: Promise<IVoteListingContract>;

  constructor(private web3Svc: Web3Service) {
    const voteListingDefinition = contract(APP_CONFIG.contracts.vote_listing);
    this._voteListingContractPromise = this.web3Svc.afterInjected()
      .then(() => voteListingDefinition.setProvider(this.web3Svc.currentProvider))
      .then(() => voteListingDefinition.deployed());
  }

  /**
   * Uses the VoteListing contract to deploy a new vote to the blockchain
   * @param {string} paramsHash the IPFS hash of the vote parameters
   * @returns {Promise<void>} A promise indicating when the contract is deployed
   */
  deployVote(paramsHash: string): Promise<void> {
    return this._voteListingContractPromise
      .then(voteListingContract => voteListingContract.deploy(paramsHash, {from: this.web3Svc.defaultAccount}))
      .then(tx => null);
  }
}

