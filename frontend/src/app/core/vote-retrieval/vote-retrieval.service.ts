/**
 * A service to retrieve and persist the VotingContract data available on the blockchain
 * The purpose of this service is to isolate the data retrieval logic and
 * avoid repeating the same data requests whenever the UI components are reloaded
 */

import { Injectable } from '@angular/core';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

import { CryptographyService } from '../cryptography/cryptography.service';
import { ErrorService } from '../error-service/error.service';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.constants';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { IBlindedAddress, IBlindSignature, IVote, IVoteParameters } from '../vote-manager/vote-manager.service';
import {
IDynamicValue, IRegistration, IVotingContractDetails,
IVotingContractSummary,
RETRIEVAL_STATUS,
VoteRetrievalServiceErrors
} from './vote-retreival.service.constants';

export interface IVoteRetrievalService {
  summaries$: Observable<IVotingContractSummary[]>;

  detailsAtIndex$(idx: number): Observable<IVotingContractDetails>;
}

@Injectable()
export class VoteRetrievalService implements IVoteRetrievalService {
  private _ipfsCache: IIPFSCache;

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingContractSvc: AnonymousVotingContractService,
              private cryptoSvc: CryptographyService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
    this._ipfsCache = {};
  }

  /**
   * Retrieves the vote summary information (from cache if possible) for each deployed
   * contract in the VoteListingService, merges them all into a single array and emits the result
   * The result is designed to be used by the VoteListingService
   * @returns {Observable<IVotingContractSummary[]>} the summary of all deployed voting contracts<br/>
   * including intermediate and error states
   */
  get summaries$(): Observable<IVotingContractSummary[]> {
    return this.voteListingSvc.deployedVotes$
      .map((addr, idx) => {
        const phase$ = this._wrapRetrieval(
          this.anonymousVotingContractSvc.at(addr).phase$
            .map(phaseIdx => VotePhases[phaseIdx])
        );

        const topic$ = this._wrapRetrieval(
          this.anonymousVotingContractSvc.at(addr).constants$
            .switchMap(constants => this._retrieveIPFSHash(constants.paramsHash, this._parametersFormatError))
            .map(params => params.topic)
        );

        const address$ = this._wrapRetrieval(addr ? Observable.of(addr) : Observable.empty());

        return phase$.combineLatest(topic$, address$, (phase, topic, contractAddr) => ({
          index: idx,
          address: contractAddr,
          phase: phase,
          topic: topic
        }));
      })
      .scan(
        (acc, summary$) => acc.combineLatest(summary$, (L, el) => L.concat(el)),
        Observable.of([])
      )
      .switch()
      .share();
  }

  /**
   * Retrieves the vote information (from cache if possible) required to view and participate in the vote
   * The result is designed to be used by the VoteComponent
   * @param {number} idx the index of the AnonymousVoting contract in the VoteListingContract
   * @returns {Observable<IVotingContractDetails>} an observable of the vote details <br/>
   * including intermediate and error states
   */
  detailsAtIndex$(idx: number): Observable<IVotingContractDetails> {
    return this.summaries$
      .filter(summaries => idx < summaries.length)
      .map(summaries => summaries[idx])
      .filter(summary => summary.address.status === RETRIEVAL_STATUS.AVAILABLE)
      .switchMap(summary => {
        const contractManager = this.anonymousVotingContractSvc.at(summary.address.value);

        const params$ = contractManager.constants$
          .switchMap(constants => this._retrieveIPFSHash(constants.paramsHash, this._parametersFormatError));

        const numPendingRegistrations$ = this._wrapRetrieval(
          contractManager.registrationHashes$
            .map(regHashes => Object.keys(regHashes).map(voter => regHashes[voter]))
            .map(hashPairs => hashPairs.filter(hashPair => hashPair.signature === null))
            .map(pending => pending.length)
        );

        const key$ = this._wrapRetrieval(params$.map(params => params.registration_key));

        const candidates$ = this._wrapRetrieval(params$.map(params => params.candidates));

        const registration$ = this._wrapRetrieval(
          contractManager.registrationHashes$
            .switchMap(regHashes =>
              Observable.from(Object.keys(regHashes))
                .mergeMap(voter => {
                  const blindedAddress$ =
                    this._retrieveIPFSHash(regHashes[voter].blindedAddress, this._blindAddressFormatError)
                      .map(obj => obj.blinded_address);

                  const blindSignature$ =
                    this._retrieveIPFSHash(regHashes[voter].signature, this._blindSignatureFormatError)
                      .map(obj => obj.blinded_signature);

                  return blindedAddress$.combineLatest(blindSignature$, (addr, sig) => ({
                    voter: voter, blindedAddress: addr, blindSignature: sig
                  }))
                    .defaultIfEmpty(null)
                    .switchMap(reg => reg === null ? Observable.throw(null) : Observable.of(reg));
                })
                .scan((L, el) => L.concat(el), [])
                .defaultIfEmpty([])
                .combineLatest(params$.map(p => p.registration_key), (L, key) => {
                  if (L.every(reg => this.cryptoSvc.verify(reg.blindedAddress, reg.blindSignature, key))) {
                    return L;
                  } else {
                    this.errSvc.add(VoteRetrievalServiceErrors.registration, null);
                    return null;
                  }
                })
                .switchMap(L => L === null ? Observable.throw(null) : Observable.of(L))
                .map(L => {
                  const registration: IRegistration = {};
                  L.map(reg => {
                    registration[reg.voter] = {blindSignature: reg.blindSignature};
                  });
                  return registration;
                })
            )
            .catch(err => <Observable<IRegistration>> Observable.empty())
        );


        const tally$ = this._wrapRetrieval(
          contractManager.voteHashes$
            .mergeMap(voteHashEvent =>
              this._retrieveIPFSHash(voteHashEvent.voteHash, this._voteFormatError)
                .defaultIfEmpty(null)
                .switchMap(vote => vote === null ? Observable.throw(null) : Observable.of(vote))
            )
            .map(vote => vote.candidateIdx)
            // create a histogram of the selected candidate indices
            .scan((arr, el) => {
                arr[el] = arr[el] ? arr[el] + 1 : 1;
                return arr;
              }, []
            )
            .startWith([])
            .combineLatest(params$.map(p => p.candidates), (totalArr, candidates) => candidates.map(
              (candidate, candidateIdx) => ({
                candidate: candidate,
                count: totalArr[candidateIdx] ? totalArr[candidateIdx] : 0
              }))
            )
            .catch(err => Observable.of(null))
        );

        return numPendingRegistrations$.combineLatest(key$, candidates$, registration$, tally$,
          (numPending, key, candidates, registration, tally) => ({
            index: idx,
            address: summary.address,
            topic: summary.topic,
            phase: summary.phase,
            numPendingRegistrations: numPending,
            key: key,
            candidates: candidates,
            registration: registration,
            results: tally
          }));
      })
      .share();
  }

  /**
   * Prepend an empty value with status "RETRIEVING" to the source observable and then
   * apply the status "AVAILABLE" to all values or emit an "UNAVAILABLE" status if the source observable is empty or null
   * @param {Observable<T>} obs the source observable
   * @returns {Observable<IDynamicValue<T>>} an observable the wraps retrieval status information around the source observable
   * @private
   */
  private _wrapRetrieval<T>(obs: Observable<T>): Observable<IDynamicValue<T>> {
    return obs
      .map(val => val === null ?
        {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null} :
        {status: RETRIEVAL_STATUS.AVAILABLE, value: val}
      )
      .defaultIfEmpty({status: RETRIEVAL_STATUS.UNAVAILABLE, value: null})
      .startWith({status: RETRIEVAL_STATUS.RETRIEVING, value: null});
  }

  /**
   * Resolves the IPFS hash (from cache if possible) and caches the result.
   * Notifies the error service if the hash cannot be resolved or the object has an invalid format
   * @param {string} hash the IPFS hash to resolve
   * @param {(obj: any) => Error} formatError a function that evaluates the returned object against <br/>
   * an expected format and returns an Error if there is a mismatch
   * @returns {Observable<any>} An observable of the retrieved object <br/>
   * or an empty observable if there is an error
   * @private
   */
  private _retrieveIPFSHash(hash: string, formatError: (obj: any) => Error): Observable<any> {
    if (!hash) {
      this.errSvc.add(VoteRetrievalServiceErrors.ipfs.nullHash, null);
      return Observable.empty();
    }

    return Observable.of(this._ipfsCache[hash] ? this._ipfsCache[hash] : this.ipfsSvc.catJSON(hash))
      .do(promise => {
        this._ipfsCache[hash] = promise;
      })
      .switchMap(promise => Observable.fromPromise(promise))
      .catch(err => {
        this.errSvc.add(VoteRetrievalServiceErrors.ipfs.retrieval, err);
        return Observable.empty();
      })
      .switchMap(obj => {
        const err = formatError(obj);
        if (err) {
          this.errSvc.add(err, null);
          return Observable.empty();
        }
        return Observable.of(obj);
      });
  }

  /**
   * Confirms the specified object matches the IVoteParameters format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   * @private
   */
  private _parametersFormatError(obj: object): Error {
    const params: IVoteParameters = <IVoteParameters> obj;
    const valid: boolean =
      params &&
      params.topic && typeof params.topic === 'string' &&
      params.candidates && Array.isArray(params.candidates) &&
      params.candidates.every(el => typeof el === 'string') &&
      params.registration_key &&
      params.registration_key.modulus && typeof params.registration_key.modulus === 'string' &&
      params.registration_key.public_exp && typeof params.registration_key.public_exp === 'string';

    return valid ? null : VoteRetrievalServiceErrors.format.parameters(params);
  }

  /**
   * Confirms the specified object matches the IBlindAddress format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   * @private
   */
  private _blindAddressFormatError(obj: object): Error {
    const blindAddress: IBlindedAddress = <IBlindedAddress> obj;
    const valid = blindAddress &&
      blindAddress.blinded_address && typeof blindAddress.blinded_address === 'string';
    return valid ? null : VoteRetrievalServiceErrors.format.blindedAddress(obj);
  }

  /**
   * Confirms the specified object matches the IBlindSignature format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   * @private
   */
  private _blindSignatureFormatError(obj: object): Error {
    const blindSignature: IBlindSignature = <IBlindSignature> obj;
    const valid = blindSignature &&
      blindSignature.blinded_signature && typeof blindSignature.blinded_signature === 'string';
    return valid ? null : VoteRetrievalServiceErrors.format.blindSignature(obj);
  }

  /**
   * Confirms the specified object matches the IVote format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   * @private
   */
  private _voteFormatError(obj: object): Error {
    const vote: IVote = <IVote> obj;
    const valid = vote &&
      vote.signed_address && typeof vote.signed_address === 'string' &&
      typeof vote.candidateIdx === 'number';
    return valid ? null : VoteRetrievalServiceErrors.format.vote(obj);
  }
}

interface IIPFSCache {
  [addr: string]: Promise<any>;
}

