import { Injectable } from '@angular/core';
import * as contract from 'truffle-contract';

import { APP_CONFIG } from '../../config';
import { IVoteListingContract } from './voteListing.contract.interface';
import { IWeb3, Web3Service } from './web3.service';


export interface IEthereumService {
  deployVote(paramsHash: string): any;
}



@Injectable()
export class EthereumService implements IEthereumService {

  private _voteListingContractPromise: Promise<IVoteListingContract>;
  private web3: IWeb3;

  constructor(private web3Svc: Web3Service) {
    const voteListingDefinition = contract(APP_CONFIG.contracts.vote_listing);
    this.web3 = web3Svc.get();
    if (typeof this.web3 === 'undefined' || !this.web3.currentProvider) {
      this._voteListingContractPromise = Promise.reject(
        'No web3 provider found. Please install the MetaMask extension (or another web3.js provider)'
      );
    } else {
      voteListingDefinition.setProvider(this.web3.currentProvider);
      this._voteListingContractPromise = voteListingDefinition.deployed();
    }
  }

  /**
   * Uses the VoteListing contract to deploy a new vote to the blockchain
   * @param {string} paramsHash the IPFS hash of the vote parameters
   * @returns {Promise<void>} A promise indicating when the contract is deployed
   */
  deployVote(paramsHash: string): Promise<void> {
    return this._voteListingContractPromise
      .then(voteListingContract => voteListingContract.deploy(paramsHash, {from: this.web3.eth.defaultAccount}))
      .then(tx => null);
  }
}

