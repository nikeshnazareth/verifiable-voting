/**
 * This class encapsulates the logic required to participate in a vote.
 * It is intended to be a middle-man between the View layer and the
 * low-level Ethereum and IPFS services.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import {
  AnonymousVotingContractErrors,
  AnonymousVotingContractService
} from '../ethereum/anonymous-voting-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { address } from '../ethereum/type.mappings';
import { ITransactionReceipt } from '../ethereum/transaction.interface';
import { IVoteTimeframes, VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';

export interface IVoteParameters {
  topic: string;
  candidates: string[];
  registration_key: {
    modulus: string;
    public_exp: string;
  };
}

export interface IVoteManagerService {
  deployVote$(timeframes: IVoteTimeframes,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuthority: address): Observable<ITransactionReceipt>;
}

export const VoteManagerServiceErrors = {
  ipfs: {
    addParametersHash: (params) => new Error(`Unable to add parameters (${params}) to IPFS`),
  }
};

@Injectable()
export class VoteManagerService implements IVoteManagerService {

  constructor(private voteListingSvc: VoteListingContractService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
  }

  /**
   * Adds the parameters to IPFS and deploys a new AnonymousVoting contract with the resulting hash
   * and the other specified parameters
   * @param {IVoteTimeframes} timeframes the unix timestamps of the vote phase deadlines
   * @param {IVoteParameters} params the vote parameters to add to IPFS
   * @param {address} eligibilityContract the contract that determines if an address is eligible to vote
   * @param {address} registrationAuth the address that can publish the blinded signatures
   * @returns {Observable<ITransactionReceipt>} an observable that emits the deployment transaction receipt</br>
   * or an empty observable if there is an error
   */
  deployVote$(timeframes: IVoteTimeframes,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuth: address): Observable<ITransactionReceipt> {
    return Observable.fromPromise(this.ipfsSvc.addJSON(params))
      .catch(err => {
        this.errSvc.add(VoteManagerServiceErrors.ipfs.addParametersHash(params), err);
        return <Observable<string>> Observable.empty();
      })
      .switchMap(hash => this.voteListingSvc.deployVote$(timeframes, hash, eligibilityContract, registrationAuth));
  }
}


