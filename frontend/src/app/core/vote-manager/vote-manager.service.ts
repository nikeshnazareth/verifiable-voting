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
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';

export interface IVoteParameters {
  parameters: string;
}

export interface IVoteManagerService {
  deployVote$(params: IVoteParameters): Observable<ITransactionReceipt>;

  getParameters$(addr: address): Observable<IVoteParameters>;
}

export const VoteManagerServiceErrors = {
  ipfs: {
    addParametersHash: (params) => new Error(`Unable to add parameters (${params}) to IPFS`),
    getParametersHash: (addr, hash) => new Error('Unable to retrieve the parameters for the AnonymousVoting contract' +
      ` at ${addr} from the IPFS hash (${hash})`)
  },
  format: {
    parametersHash: (params) => new Error(`Retrieved parameters (${params}) do not match the expected format`)
  }
};

@Injectable()
export class VoteManagerService implements IVoteManagerService {

  constructor(private voteListingSvc: VoteListingContractService,
              private votingContractSvc: AnonymousVotingContractService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
  }

  /**
   * Adds the parameters to IPFS and deploys a new AnonymousVoting contract with the resulting hash
   * @param {IVoteParameters} params the vote parameters to add to IPFS
   * @returns {Observable<ITransactionReceipt>} an observable that emits the deployment transaction receipt</br>
   * or an empty observable if there is an error
   */
  deployVote$(params: IVoteParameters): Observable<ITransactionReceipt> {
    return Observable.fromPromise(this.ipfsSvc.addJSON(params))
      .catch(() => {
        this.errSvc.add(VoteManagerServiceErrors.ipfs.addParametersHash(params));
        return <Observable<string>> Observable.empty();
      })
      .switchMap(hash => this.voteListingSvc.deployVote$(hash));
  }

  /**
   * Gets the parameters of the AnonymousVoting contract at the specified address.
   * Notifies the Error service if the IPFS hash can't be obtained from Ethereum,
   * or the parameters can't be obtained from IPFS
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<IVoteParameters>} an observable that emits the parameters and completes </br>
   * or an empty observable if the parameters can't be obtained
   */
  getParameters$(addr: address): Observable<IVoteParameters> {
    return this.votingContractSvc
      .contractAt(addr)
      .switchMap(contract => Observable.fromPromise(
        contract.parametersHash.call()
          .catch(() => {
            this.errSvc.add(AnonymousVotingContractErrors.paramsHash(addr));
            return null;
          })
      ))
      .filter(hash => hash) // filter out the null value if the hash can't be retrieved from Ethereum
      .switchMap(hash => Observable.fromPromise(
        this.ipfsSvc.catJSON(hash)
          .catch(() => {
            this.errSvc.add(VoteManagerServiceErrors.ipfs.getParametersHash(addr, hash));
            return null;
          })
      ))
      .filter(params => params) // filter out the null value if the parameters can't be retrieved from IPFS
      .map(params => this.confirmParametersFormat(params))
      .filter(params => params !== null) // filter out the null value if the retrieved object has the wrong format
      .map(params => <IVoteParameters> params);
  }

  /**
   * Notifies the Error Service if the params object doesn't match the IVoteParameters interface
   * @param {Object} params the object to check
   * @returns {IVoteParameters} the parameters object if it matches or null otherwise
   */
  private confirmParametersFormat(params: object) {
    if (params.hasOwnProperty('parameters')) {
      return <IVoteParameters> params;
    } else {
      this.errSvc.add(VoteManagerServiceErrors.format.parametersHash(params));
      return null;
    }
  }
}


