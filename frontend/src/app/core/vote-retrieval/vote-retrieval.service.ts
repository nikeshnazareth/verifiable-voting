/**
 * A service to retrieve and persist the VotingContract data available on the blockchain
 * The purpose of this service is to isolate the data retrieval logic and
 * avoid repeating the same data requests whenever the UI components are reloaded
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/shareReplay';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/elementAt';
import 'rxjs/add/operator/mergeMap';

import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { ReplacementAnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/replacement-contract.service';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.api';
import { address } from '../ethereum/type.mappings';
import { IPFSService } from '../ipfs/ipfs.service';
import { IBlindedAddress, IBlindSignature, IVote, IVoteParameters } from '../vote-manager/vote-manager.service';
import { CryptographyService } from '../cryptography/cryptography.service';
import { ErrorService } from '../error-service/error.service';
import {
  IDynamicValue, IRegistration, IReplacementVotingContractDetails,
  IVotingContractDetails,
  IVotingContractSummary,
  RETRIEVAL_STATUS,
  VoteRetrievalServiceErrors
} from './vote-retreival.service.constants';

export interface IVoteRetrievalService {
  summaries$: Observable<IVotingContractSummary[]>;

  detailsAtIndex$(idx: number): Observable<IVotingContractDetails>;

  replacementDetailsAtIndex$(idx: number): Observable<IReplacementVotingContractDetails>;

  blindSignatureAt$(contractAddr: address, publicVoterAddr: address): Observable<string>;
}

@Injectable()
export class VoteRetrievalService implements IVoteRetrievalService {
  private _voteCache: IVoteCache;
  private _ipfsCache: IIPFSCache;

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingSvc: AnonymousVotingContractService,
              private replacementAnonymousVotingSvc: ReplacementAnonymousVotingContractService,
              private cryptoSvc: CryptographyService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
    this._voteCache = {};
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
          this.replacementAnonymousVotingSvc.at(addr).phase$
            .map(phaseIdx => VotePhases[phaseIdx])
        );

        const topic$ = this._wrapRetrieval(
          this.replacementAnonymousVotingSvc.at(addr).constants$
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
   * @returns {Observable<IReplacementVotingContractDetails>} an observable of the vote details <br/>
   * including intermediate and error states
   */
  replacementDetailsAtIndex$(idx: number): Observable<IReplacementVotingContractDetails> {
    return this.summaries$
      .filter(summaries => idx < summaries.length)
      .map(summaries => summaries[idx])
      .switchMap(summary => {
        const contractManager = this.replacementAnonymousVotingSvc.at(summary.address.value);

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

        return numPendingRegistrations$.combineLatest(key$, candidates$, registration$,
          (numPending, key, candidates, registration) => ({
            index: idx,
            address: summary.address,
            topic: summary.topic,
            phase: summary.phase,
            numPendingRegistrations: numPending,
            key: key,
            candidates: candidates,
            registration: registration
          }));
      })
      .share();
  }

  /**
   * Prepend an empty value with status "RETRIEVING" to the source observable and then
   * apply the status "AVAILABLE" to all values or emit an "UNAVAILABLE" status if the source observable is empty
   * @param {Observable<T>} obs the source observable
   * @returns {Observable<IDynamicValue<T>>} an observable the wraps retrieval status information around the source observable
   * @private
   */
  private _wrapRetrieval<T>(obs: Observable<T>): Observable<IDynamicValue<T>> {
    return obs
      .map(val => ({status: RETRIEVAL_STATUS.AVAILABLE, value: val}))
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
   * Retrieves the vote information (from cache if possible) for the specified contract
   * @param {number} idx the index of the AnonymousVoting contract in the VoteListingContract
   * @returns {Observable<IReplacementVotingContractDetails>} an observable of the vote details <br/>
   * including intermediate and error states
   */
  detailsAtIndex$(idx: number): Observable<IVotingContractDetails> {
    return this.voteListingSvc.deployedVotes$
      .filter((addr, _idx) => _idx === idx)
      .defaultIfEmpty(null)
      .switchMap(addr => this._getVoteDetails(addr, idx));
  }

  /**
   * Retrieves the blinded signature for the specified voter at the specified contract
   * Notifies the error service if the hash cannot be obtained from the contract,
   * the blinded signature cannot be obtained from the hash, or the retrieved value is incorrectly formatted
   * @param {address} contractAddr the address of the AnonymousVoting contract
   * @param {address} publicVoterAddr the voter address
   * @returns {Observable<string>} an observable of the blinded signature or an empty observable if there is an error
   */
  blindSignatureAt$(contractAddr: address, publicVoterAddr: address): Observable<string> {
    return this.anonymousVotingSvc.blindSignatureHashAt$(contractAddr, publicVoterAddr)
      .map(hash => this.ipfsSvc.catJSON(hash))
      .switchMap(wrappedBlindSigPromise => Observable.fromPromise(wrappedBlindSigPromise))
      .catch(err => {
        this.errSvc.add(VoteRetrievalServiceErrors.ipfs.getBlindSignature(contractAddr, publicVoterAddr), err);
        return <Observable<object>> Observable.empty();
      })
      .map(wrappedBlindedSig => this._confirmBlindSignatureFormat(wrappedBlindedSig))
      .filter(wrappedBlindedSig => wrappedBlindedSig != null)
      .map(wrappedBlindedSig => wrappedBlindedSig.blinded_signature);
  }

  /**
   * Obtains the vote details for the specified AnonymousVoting contract (from cache if possible)
   * @param {address} addr the address of the contract
   * @param {number} idx the index of the contract in the VoteListingContract array
   * @returns {Observable<IReplacementVotingContractDetails>} (an observable of) the vote details <br/>
   * or a placeholder value if the information cannot be retrieved
   * @private
   */
  private _getVoteDetails(addr: address, idx: number): Observable<IVotingContractDetails> {
    if (!addr) {
      return Observable.of(this._placeholderVotingContractDetails(idx, RETRIEVAL_STATUS.UNAVAILABLE));
    }

    if (!this._voteCache[addr]) {
      const phase$: Observable<string> = this.anonymousVotingSvc.phaseAt$(addr)
        .map(phaseIdx => VotePhases[phaseIdx])
        .defaultIfEmpty(RETRIEVAL_STATUS.UNAVAILABLE)
        .startWith(RETRIEVAL_STATUS.RETRIEVING);


      const parameters$: Observable<IVoteParameters> = this.anonymousVotingSvc.paramsHashAt$(addr)
        .map(hash => this.ipfsSvc.catJSON(hash))
        .switchMap(paramsPromise => Observable.fromPromise(paramsPromise))
        .catch(err => {
          this.errSvc.add(VoteRetrievalServiceErrors.ipfs.getParameters(addr), err);
          return <Observable<object>> Observable.empty();
        })
        .map(params => this._confirmParametersFormat(params))
        .filter(params => params != null)
        .defaultIfEmpty(this._placeholderParameters(RETRIEVAL_STATUS.UNAVAILABLE))
        .startWith(this._placeholderParameters(RETRIEVAL_STATUS.RETRIEVING));

      const regDeadline$: Observable<Date | string> = this.anonymousVotingSvc.registrationDeadlineAt$(addr)
        .defaultIfEmpty(RETRIEVAL_STATUS.UNAVAILABLE)
        .startWith(RETRIEVAL_STATUS.RETRIEVING);

      const votingDeadline$: Observable<Date | string> = this.anonymousVotingSvc.votingDeadlineAt$(addr)
        .defaultIfEmpty(RETRIEVAL_STATUS.UNAVAILABLE)
        .startWith(RETRIEVAL_STATUS.RETRIEVING);

      const pendingRegistrations$: Observable<number | string> = this.anonymousVotingSvc.pendingRegistrationsAt$(addr)
        .concat(Observable.of(RETRIEVAL_STATUS.UNAVAILABLE))
        .startWith(RETRIEVAL_STATUS.RETRIEVING);

      const votes$: Observable<string | number[]> = this.anonymousVotingSvc.voteHashesAt$(addr)
        .map(voteHash => this.ipfsSvc.catJSON(voteHash))
        .switchMap(votePromise => Observable.fromPromise(votePromise))
        .catch(err => {
          this.errSvc.add(VoteRetrievalServiceErrors.ipfs.getVote(addr), err);
          return <Observable<IVote>> Observable.empty();
        })
        .map(vote => this._confirmVoteFormat(vote))
        .filter(vote => vote != null)
        .map(vote => vote.candidateIdx)
        // create a histogram of the selected candidate indices
        .scan((arr, el) => {
            arr[el] = arr[el] ? arr[el] + 1 : 1;
            return arr;
          },
          []
        )
        .concat(Observable.of(RETRIEVAL_STATUS.UNAVAILABLE))
        .startWith([]);

      this._voteCache[addr] = phase$.combineLatest(
        parameters$,
        regDeadline$,
        votingDeadline$,
        pendingRegistrations$,
        votes$,
        (phase, parameters, regDeadline, votingDeadline, pendingRegistrations, votes) =>
          this._newContractDetails(
            idx, addr, phase, parameters, regDeadline, votingDeadline, pendingRegistrations, votes
          )
      )
        .shareReplay(1);
    }
    return this._voteCache[addr];
  }

  /**
   * Notifies the Error Service if the params object doesn't match the IVoteParameters interface
   * @param {Object} obj the object to check
   * @returns {IVoteParameters} the parameters object if it matches or null otherwise
   * @private
   */
  private _confirmParametersFormat(obj: object): IVoteParameters {
    const params: IVoteParameters = <IVoteParameters> obj;
    const valid: boolean =
      params &&
      params.topic &&
      typeof params.topic === 'string' &&
      params.candidates &&
      Array.isArray(params.candidates) &&
      params.candidates.every(el => typeof el === 'string') &&
      params.registration_key &&
      params.registration_key.modulus &&
      typeof params.registration_key.modulus === 'string' &&
      params.registration_key.public_exp &&
      typeof params.registration_key.public_exp === 'string';

    if (valid) {
      return params;
    } else {
      this.errSvc.add(VoteRetrievalServiceErrors.format.parameters(params), null);
      return null;
    }
  }

  /**
   * Notifies the Error Service if the object doesn't match the IBlindedSignature interface
   * @param {Object} obj the object to check
   * @returns {IBlindSignature} the blinded signature object if it matches or null otherwise
   * @private
   */
  private _confirmBlindSignatureFormat(obj: object): IBlindSignature {
    const wrappedBlindedSig: IBlindSignature = <IBlindSignature> obj;
    const valid: boolean =
      wrappedBlindedSig &&
      wrappedBlindedSig.blinded_signature &&
      typeof wrappedBlindedSig.blinded_signature === 'string';

    if (valid) {
      return wrappedBlindedSig;
    } else {
      this.errSvc.add(VoteRetrievalServiceErrors.format.blindSignature(wrappedBlindedSig), null);
      return null;
    }
  }

  private _confirmVoteFormat(obj: object): IVote {
    const vote: IVote = <IVote> obj;
    const valid: boolean =
      vote &&
      vote.signed_address &&
      typeof vote.signed_address === 'string' &&
      vote.candidateIdx &&
      typeof vote.candidateIdx === 'number';

    if (valid) {
      return vote;
    } else {
      this.errSvc.add(VoteRetrievalServiceErrors.format.vote(vote), null);
      return null;
    }
  }

  /**
   * @param {number} idx the index of the contract in the VoteListingContract array
   * @param {string} placeholder a placeholder value for all string properties
   * @returns {IReplacementVotingContractDetails} a stub IVotingContractDetails object<br/>
   * to be used when the details are not yet available (or unavailable)
   */
  private _placeholderVotingContractDetails(idx: number, placeholder: string): IVotingContractDetails {
    const params: IVoteParameters = this._placeholderParameters(placeholder);
    return {
      index: idx,
      address: placeholder,
      phase: placeholder,
      parameters: params,
      registrationDeadline: {
        status: placeholder,
        value: null
      },
      votingDeadline: {
        status: placeholder,
        value: null
      },
      pendingRegistrations: {
        status: placeholder,
        value: null
      },
      votes: {
        status: placeholder,
        value: null
      }
    };
  }

  /**
   * @param {string} placeholder a placeholder value for all string properties
   * @returns {IVoteParameters} a stub IVoteParameters object with the placeholder in place of all strings
   */
  private _placeholderParameters(placeholder: string): IVoteParameters {
    return {
      topic: placeholder,
      candidates: [],
      registration_key: {
        modulus: placeholder,
        public_exp: placeholder
      }
    };
  }

  /**
   * @returns {IReplacementVotingContractDetails} a new IVotingContractDetails object with the specified values
   */
  private _newContractDetails(index, addr, phase, parameters, regDeadline, votingDeadline,
                              pendingRegistrations, votes): IVotingContractDetails {
    return {
      index: index,
      address: addr,
      phase: phase,
      parameters: parameters,
      registrationDeadline: {
        status: typeof regDeadline === 'string' ? regDeadline : RETRIEVAL_STATUS.AVAILABLE,
        value: typeof regDeadline === 'string' ? null : regDeadline
      },
      votingDeadline: {
        status: typeof votingDeadline === 'string' ? votingDeadline : RETRIEVAL_STATUS.AVAILABLE,
        value: typeof votingDeadline === 'string' ? null : votingDeadline
      },
      pendingRegistrations: {
        status: typeof pendingRegistrations === 'string' ? pendingRegistrations : RETRIEVAL_STATUS.AVAILABLE,
        value: typeof pendingRegistrations === 'string' ? null : pendingRegistrations
      },
      votes: {
        status: RETRIEVAL_STATUS.AVAILABLE,
        value: votes
      }
    };
  }
}

interface IVoteCache {
  [addr: string]: Observable<IVotingContractDetails>;
}

interface IIPFSCache {
  [addr: string]: Promise<any>;
}

