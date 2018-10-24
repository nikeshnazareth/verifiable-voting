/**
 * This class encapsulates the logic required to participate in a vote.
 * It is intended to be a middle-man between the View layer and the
 * low-level Ethereum and IPFS services.
 */

import { Injectable } from '@angular/core';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

import { CryptographyService } from '../cryptography/cryptography.service';
import { IRSAKey } from '../cryptography/rsa-key.interface';
import { ErrorService } from '../error-service/error.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { ITransactionReceipt } from '../ethereum/transaction.interface';
import { address } from '../ethereum/type.mappings';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IVoteParameters } from '../ipfs/formats.interface';
import { IPFSService } from '../ipfs/ipfs.service';
import { TransactionService } from '../transaction-service/transaction.service';
import { VoteManagerErrors } from './vote-manager-errors';
import { VoteManagerMessages } from './vote-manager-messages';

export interface IVoteManagerService {
  deployVote$(registrationDeadline: number,
              votingDeadline: number,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuthority: address): Observable<void>;

  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<void>;

  completeRegistrationAt$(contractAddr: address,
                          voterAddr: address,
                          registrationAuthority: address,
                          registrationKey: IRSAKey,
                          privateExponent: string,
                          blindedAddress: string): Observable<void>;

  voteAt$(contractAddr: address,
          registrationKey: IRSAKey,
          anonymousAddr: address,
          blindedSignature: string,
          blindingFactor: string,
          candidateIdx: number): Observable<void>;
}

@Injectable()
export class VoteManagerService implements IVoteManagerService {

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingContractSvc: AnonymousVotingContractService,
              private cryptoSvc: CryptographyService,
              private txSvc: TransactionService,
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
   * @returns {Observable<void>} an observable that emits once and completes or an empty observable if there is an error
   */
  deployVote$(registrationDeadline: number,
              votingDeadline: number,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuth: address): Observable<void> {
    return this.ipfsSvc.addJSON(params)
      .catch(err => {
        this.errSvc.add(VoteManagerErrors.ipfs.addParametersHash(params), err);
        return <Observable<string>> Observable.empty();
      })
      .do(hash => {
        const tx: Observable<ITransactionReceipt> = this.voteListingSvc.deployVote$({
          paramsHash: hash,
          eligibilityContract: eligibilityContract,
          registrationAuthority: registrationAuth,
          registrationDeadline: registrationDeadline,
          votingDeadline: votingDeadline
        });
        this.txSvc.add(tx, VoteManagerMessages.deploy(params.topic));
      })
      .map(() => {
      });
  }

  /**
   * Calculates the blinded address, adds it to IPFS and registers the voter with the resulting hash
   * @param {address} contractAddr the AnonymousVoting contract address
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @param {address} voterAddr the public address the voter will use to register
   * @param {address} anonymousAddr the anonymous address the voter will use to vote
   * @param {string} blindingFactor the RSA blinding factor used to protect anonymity of the anonymous address
   * @returns {Observable<void>} an observable that emits once and completes or an empty observable if there is an error
   */
  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<void> {
    return Observable.of(this.cryptoSvc.blind(anonymousAddr, blindingFactor, registrationKey))
      .filter(blindedAddr => blindedAddr !== null)
      .map(blindedAddr => ({blinded_address: blindedAddr}))
      .switchMap(wrappedBlindedAddr => this.ipfsSvc.addJSON(wrappedBlindedAddr))
      .catch(err => {
        this.errSvc.add(VoteManagerErrors.ipfs.addBlindedAddress(), err);
        return <Observable<string>> Observable.empty();
      })
      .do(blindedAddrHash => {
        const tx: Observable<ITransactionReceipt> =
          this.anonymousVotingContractSvc.at(contractAddr).register$(voterAddr, blindedAddrHash);
        this.txSvc.add(tx, VoteManagerMessages.register());
      })
      .map(() => {
      });
  }

  /**
   * Calculates the blind signature, adds it to IPFS and completes the voter registration with the resulting hash
   * @param {address} contractAddr the AnonymousVoting contract address
   * @param {address} voterAddr the public address the voter used to register
   * @param {address} registrationAuthority the address of the registration authority (the only one allowed to complete registrations)
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @param {string} privateExponent the private RSA exponent used to sign the blinded address
   * @param {string} blindedAddress the blinded anonymous address the voter will use to vote
   * @returns {Observable<void>} an observable that emits once and completes or an empty observable if there is an error
   */
  completeRegistrationAt$(contractAddr: address,
                          voterAddr: address,
                          registrationAuthority: address,
                          registrationKey: IRSAKey,
                          privateExponent: string,
                          blindedAddress: string): Observable<void> {
    return Observable.of(this.cryptoSvc.rawSign(blindedAddress, registrationKey.modulus, privateExponent))
      .filter(blindSignature => blindSignature !== null)
      .map(blindSignature => ({blinded_signature: blindSignature}))
      .switchMap(wrappedBlindSig => this.ipfsSvc.addJSON(wrappedBlindSig))
      .catch(err => {
        this.errSvc.add(VoteManagerErrors.ipfs.addBlindSignature(), err);
        return <Observable<string>> Observable.empty();
      })
      .do(blindSigHash => {
        const tx: Observable<ITransactionReceipt> =
          this.anonymousVotingContractSvc.at(contractAddr).completeRegistration$(voterAddr, blindSigHash, registrationAuthority);
        this.txSvc.add(tx, VoteManagerMessages.completeRegistration());
      })
      .map(() => {
      });
  }

  /**
   * Unblinds the blindedSignature, adds it to IPFS along with the candidate, and votes with the resulting hash
   * @param {address} contractAddr the AnonymousVoting contract address
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @param {address} anonymousAddr the anonymous address to vote with
   * @param {string} blindedSignature the blinded signature that the Vote Authority published
   * @param {string} blindingFactor the RSA blinding factor user to protect anonymity of the anonymous address
   * @param {number} candidateIdx the index of the selected candidate in the candidate list
   * @returns {Observable<void>} an observable that emits once and completes or an empty observable if there is an error
   */
  voteAt$(contractAddr: address,
          registrationKey: IRSAKey,
          anonymousAddr: address,
          blindedSignature: string,
          blindingFactor: string,
          candidateIdx: number): Observable<void> {
    return Observable.of(this.cryptoSvc.unblind(blindedSignature, blindingFactor, registrationKey))
      .filter(signedAddress => signedAddress != null)
      .filter(signedAddress => this.confirmAuthorised(anonymousAddr, signedAddress, registrationKey))
      .map(signedAddress => ({
        signed_address: signedAddress,
        candidateIdx: candidateIdx
      }))
      .switchMap(vote => this.ipfsSvc.addJSON(vote))
      .catch(err => {
        this.errSvc.add(VoteManagerErrors.ipfs.addVote(), err);
        return <Observable<string>> Observable.empty();
      })
      .do(voteHash => {
        const tx: Observable<ITransactionReceipt> =
          this.anonymousVotingContractSvc.at(contractAddr).vote$(anonymousAddr, voteHash);
        this.txSvc.add(tx, VoteManagerMessages.vote());
      })
      .map(() => {
      });
  }

  /**
   * Notifies the error service if the signed address does not match the anonymous address
   * @param {address} anonymousAddr the anonymous address that the voter will use to vote
   * @param {string} signedAddr the signed address that proves the anonymous address is eligible to vote
   * @param {IRSAKey} registrationKey the RSA key of the registration authority
   * @returns {boolean} whether the signed address matches the anonymous address
   * @private
   */
  private confirmAuthorised(anonymousAddr: address, signedAddr: string, registrationKey: IRSAKey): boolean {
    if (!this.cryptoSvc.verify(anonymousAddr, signedAddr, registrationKey)) {
      this.errSvc.add(VoteManagerErrors.unauthorised(), null);
      return false;
    }
    return true;
  }
}


