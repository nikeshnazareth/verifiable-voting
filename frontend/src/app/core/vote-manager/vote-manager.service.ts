/**
 * This class encapsulates the logic required to participate in a vote.
 * It is intended to be a middle-man between the View layer and the
 * low-level Ethereum and IPFS services.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/fromPromise';

import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { address } from '../ethereum/type.mappings';
import { ITransactionReceipt } from '../ethereum/transaction.interface';
import { IVoteTimeframes, VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { CryptographyService, IRSAKey } from '../cryptography/cryptography.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';

export interface IVoteParameters {
  topic: string;
  candidates: string[];
  registration_key: IRSAKey;
}

export interface IBlindedAddress {
  blinded_address: string;
}

export interface IBlindedSignature {
  blinded_signature: string;
}

export interface IVote {
  signed_address: string;
  candidate: string;
}

export interface IVoteManagerService {
  deployVote$(timeframes: IVoteTimeframes,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuthority: address): Observable<ITransactionReceipt>;

  registerAt$(contractAddress: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<ITransactionReceipt>;
}

export const VoteManagerServiceErrors = {
  ipfs: {
    addParametersHash: (params) => new Error(`Unable to add parameters (${params}) to IPFS`),
    addBlindedAddress: () => new Error('Unable to add blinded address to IPFS')
  }
};

@Injectable()
export class VoteManagerService implements IVoteManagerService {

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingSvc: AnonymousVotingContractService,
              private cryptoSvc: CryptographyService,
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

  /**
   * Calculates the blinded address, adds it to IPFS and registers the voter with the resulting hash
   * @param {address} contractAddr the AnonymousVoting contract address
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @param {address} voterAddr the public address the voter will use to register
   * @param {address} anonymousAddr the anonymous address the voter will use to vote
   * @param {string} blindingFactor the RSA blinding factor used to protect anonymity of the voting address
   * @returns {Observable<ITransactionReceipt>} an observable that emits the registration transaction receipt<br/>
   * or an empty observable if there is an error
   */
  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<ITransactionReceipt> {
    return Observable.of(
      this.cryptoSvc.blind(anonymousAddr, blindingFactor, registrationKey)
    )
      .filter(blindedAddr => blindedAddr !== null)
      .map(blindedAddr => ({blinded_address: blindedAddr}))
      .map(wrappedBlindedAddr => this.ipfsSvc.addJSON(wrappedBlindedAddr))
      .switchMap(blindedAddrHashPromise => Observable.fromPromise(blindedAddrHashPromise))
      .catch(err => {
        this.errSvc.add(VoteManagerServiceErrors.ipfs.addBlindedAddress(), err);
        return <Observable<string>> Observable.empty();
      })
      .switchMap(blindedAddrHash => this.anonymousVotingSvc.registerAt$(
        contractAddr, voterAddr, blindedAddrHash
      ));
  }
}


