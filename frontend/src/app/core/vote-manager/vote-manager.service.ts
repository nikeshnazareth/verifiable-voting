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
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
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

export interface IBlindSignature {
  blinded_signature: string;
}

export interface IVote {
  signed_address: string;
  candidateIdx: number;
}

export interface IVoteManagerService {
  deployVote$(registrationDeadline: number,
              votingDeadline: number,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuthority: address): Observable<ITransactionReceipt>;

  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<ITransactionReceipt>;

  voteAt$(contractAddr: address,
          registrationKey: IRSAKey,
          anonymousAddr: address,
          blindedSignature: string,
          blindingFactor: string,
          candidateIdx: number): Observable<ITransactionReceipt>;
}

export const VoteManagerServiceErrors = {
  ipfs: {
    addParametersHash: (params) => new Error(`Unable to add parameters (${params}) to IPFS`),
    addBlindedAddress: () => new Error('Unable to add blinded address to IPFS'),
    addVote: () => new Error('Unable to add the vote to IPFS')
  },
  unauthorised: () => new Error('The specified anonymous address and blinding factor do not match the registered values'),
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
   * @param {number} registrationDeadline the unix timestamp of the registration phase deadline
   * @param {number} votingDeadline the unix timestamp of the voting phase deadline
   * @param {IVoteParameters} params the vote parameters to add to IPFS
   * @param {address} eligibilityContract the contract that determines if an address is eligible to vote
   * @param {address} registrationAuth the address that can publish the blinded signatures
   * @returns {Observable<ITransactionReceipt>} an observable that emits the deployment transaction receipt</br>
   * or an empty observable if there is an error
   */
  deployVote$(registrationDeadline: number,
              votingDeadline: number,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuth: address): Observable<ITransactionReceipt> {
    return Observable.fromPromise(this.ipfsSvc.addJSON(params))
      .catch(err => {
        this.errSvc.add(VoteManagerServiceErrors.ipfs.addParametersHash(params), err);
        return <Observable<string>> Observable.empty();
      })
      .switchMap(hash => this.voteListingSvc.deployVote$({
        paramsHash: hash,
        eligibilityContract: eligibilityContract,
        registrationAuthority: registrationAuth,
        registrationDeadline: registrationDeadline,
        votingDeadline: votingDeadline
      }));
  }

  /**
   * Calculates the blinded address, adds it to IPFS and registers the voter with the resulting hash
   * @param {address} contractAddr the AnonymousVoting contract address
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @param {address} voterAddr the public address the voter will use to register
   * @param {address} anonymousAddr the anonymous address the voter will use to vote
   * @param {string} blindingFactor the RSA blinding factor used to protect anonymity of the anonymous address
   * @returns {Observable<ITransactionReceipt>} an observable that emits the registration transaction receipt<br/>
   * or an empty observable if there is an error
   */
  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<ITransactionReceipt> {
    return Observable.of(this.cryptoSvc.blind(anonymousAddr, blindingFactor, registrationKey))
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

  /**
   * Unblinds the blindedSignature, adds it to IPFS along with the candidate, and votes with the resulting hash
   * @param {address} contractAddr the AnonymousVoting contract address
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @param {address} anonymousAddr the anonymous address to vote with
   * @param {string} blindedSignature the blinded signature that the Vote Authority published
   * @param {string} blindingFactor the RSA blinding factor user to protect anonymity of the anonymous address
   * @param {number} candidateIdx the index of the selected candidate in the candidate list
   * @returns {Observable<ITransactionReceipt>} an observable that emits the vote transaction receipt</br>
   * or an empty observable if there is an error
   */
  voteAt$(contractAddr: address,
          registrationKey: IRSAKey,
          anonymousAddr: address,
          blindedSignature: string,
          blindingFactor: string,
          candidateIdx: number): Observable<ITransactionReceipt> {
    return Observable.of(this.cryptoSvc.unblind(blindedSignature, blindingFactor, registrationKey))
      .filter(signedAddress => signedAddress != null)
      .filter(signedAddress => this._confirmAuthorised(anonymousAddr, signedAddress, registrationKey))
      .map(signedAddress => ({
        signed_address: signedAddress,
        candidateIdx: candidateIdx
      }))
      .map(vote => this.ipfsSvc.addJSON(vote))
      .switchMap(voteHashPromise => Observable.fromPromise(voteHashPromise))
      .catch(err => {
        this.errSvc.add(VoteManagerServiceErrors.ipfs.addVote(), err);
        return <Observable<string>> Observable.empty();
      })
      .switchMap(voteHash => this.anonymousVotingSvc.voteAt$(contractAddr, anonymousAddr, voteHash));
  }

  /**
   * Notifies the error service if the signed address does not match the anonymous address
   * @param {address} anonymousAddr the anonymous address that the voter will use to vote
   * @param {string} signedAddr the signed address that proves the anonymous address is eligible to vote
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @returns {boolean} whether the signed address matches the anonymous address
   * @private
   */
  private _confirmAuthorised(anonymousAddr: address, signedAddr: string, registrationKey: IRSAKey): boolean {
    if (!this.cryptoSvc.verify(anonymousAddr, signedAddr, registrationKey)) {
      this.errSvc.add(VoteManagerServiceErrors.unauthorised(), null);
      return false;
    }
    return true;
  }
}


