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
import { AsyncSubject } from 'rxjs/index';
import { Observable } from 'rxjs/Observable';

import { ICandidateTotal } from '../../ui/vote/results/results-component';
import { CryptographyService } from '../cryptography/cryptography.service';
import { IRSAKey } from '../cryptography/rsa-key.interface';
import { ErrorService } from '../error-service/error.service';
import { IAnonymousVotingContractManager, IRegistrationHashes } from '../ethereum/anonymous-voting-contract/contract-manager';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.constants';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { address } from '../ethereum/type.mappings';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IVote, IVoteParameters } from '../ipfs/formats.interface';
import { IPFSService } from '../ipfs/ipfs.service';
import { FormatValidator } from './format-validator';
import { VoteRetrievalErrors } from './vote-retreival-errors';
import {
  IDynamicValue,
  IRegistration, ISinglePendingRegistration, ISingleVoterRegistration,
  IVotingContractDetails,
  IVotingContractSummary,
  RetrievalStatus
} from './vote-retreival.service.constants';

export interface IVoteRetrievalService {
  summaries$: Observable<IVotingContractSummary[]>;

  detailsAtIndex$(idx: number): Observable<IVotingContractDetails>;
}

@Injectable()
export class VoteRetrievalService implements IVoteRetrievalService {
  private ipfsCache: IIPFSCache;

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingContractSvc: AnonymousVotingContractService,
              private cryptoSvc: CryptographyService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
    this.ipfsCache = {};
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
        const cm: IAnonymousVotingContractManager = this.anonymousVotingContractSvc.at(addr);
        const phase$ = this.phase$(cm).pipe(this.wrapRetrieval);
        const topic$ = this.params$(cm).map(params => params.topic).pipe(this.wrapRetrieval);
        const address$ = Observable.of(addr).pipe(this.wrapRetrieval);

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
      .switch();
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
      .filter(summary => summary.address.status === RetrievalStatus.available)
      .switchMap(summary => {
        const cm = this.anonymousVotingContractSvc.at(summary.address.value);
        const regAuth$ = cm.constants$.map(constants => constants.registrationAuthority).pipe(this.wrapRetrieval);
        const pendingRegistrations$ = this.pendingRegistrations$(cm).pipe(this.wrapRetrieval);
        const key$ = this.params$(cm).map(params => params.registration_key).pipe(this.wrapRetrieval);
        const candidates$ = this.params$(cm).map(params => params.candidates).pipe(this.wrapRetrieval);
        const registration$ = this.registration$(cm).pipe(this.wrapRetrieval);
        const tally$ = this.tally(cm).pipe(this.wrapRetrieval);

        return regAuth$.combineLatest(pendingRegistrations$, key$, candidates$, registration$, tally$,
          (regAuth, pendingRegistrations, key, candidates, registration, tally) => ({
            index: idx,
            address: summary.address,
            topic: summary.topic,
            phase: summary.phase,
            registrationAuthority: regAuth,
            pendingRegistrations: pendingRegistrations,
            key: key,
            candidates: candidates,
            registration: registration,
            results: tally
          }));
      });
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
  private retrieveIPFSHash(hash: string, formatError: (obj: any) => Error): Observable<any> {
    if (!hash) {
      this.errSvc.add(VoteRetrievalErrors.ipfs.nullHash, null);
      return Observable.empty();
    }

    if (!this.ipfsCache[hash]) {
      this.ipfsCache[hash] = new AsyncSubject<any>();
      this.ipfsSvc.catJSON(hash)
        .catch(err => {
          this.errSvc.add(VoteRetrievalErrors.ipfs.retrieval, err);
          return Observable.empty();
        })
        .switchMap(obj => {
          const err = formatError(obj);
          if (err) {
            this.errSvc.add(err, null);
            return Observable.empty();
          }
          return Observable.of(obj);
        }).subscribe(this.ipfsCache[hash]);
    }

    return Observable.from(this.ipfsCache[hash]);
  }

  /**
   * @param {IAnonymousVotingContractManager} cm the contract manager for the AnonymousVoting contract
   * @returns {Observable<string>} an observable that emits the name of the current phase
   * @private
   */
  private phase$(cm: IAnonymousVotingContractManager): Observable<string> {
    return cm.phase$.map(phaseIdx => VotePhases[phaseIdx]);
  }

  /**
   * Resolves the vote parameters from their IPFS hash
   * @param {IAnonymousVotingContractManager} cm the contract manager for the AnonymousVoting contract
   * @returns {Observable<IVoteParameters>} an observable that emits the vote parameters object or an
   * empty observable if there is an error
   * @private
   */
  private params$(cm: IAnonymousVotingContractManager): Observable<IVoteParameters> {
    return cm.constants$
      .switchMap(constants => this.retrieveIPFSHash(constants.paramsHash, FormatValidator.parametersFormatError));
  }

  /**
   * Retrieves the blinded addresses for each pending registration
   * @param {IAnonymousVotingContractManager} cm the contract manager for the AnonymousVoting contract
   * @returns {Observable<ISinglePendingRegistration[]>} an observable that emits the list of pending registrations
   * or null if there is an error
   */
  private pendingRegistrations$(cm: IAnonymousVotingContractManager): Observable<ISinglePendingRegistration[]> {
    return cm.registrationHashes$
      .map(regHashes => Object.keys(regHashes).map(voter => (
        {voter: voter, hashPair: regHashes[voter]}
      )))
      .switchMap(voterHashes => Observable.from(voterHashes))
      .filter(voterHash => voterHash.hashPair.signature === null)
      .mergeMap(voterHash => this.retrieveIPFSHash(voterHash.hashPair.blindedAddress, FormatValidator.blindAddressFormatError)
        .map(obj => obj.blinded_address)
        .map(blindedAddress => ({voter: voterHash.voter, blindedAddress: blindedAddress}))
        .pipe(this.throwIfEmpty)
      )
      .scan((arr, el) => arr.concat(el), [])
      .startWith([])
      .catch(err => Observable.of(null));
  }

  /**
   * Retrieves and validates the registration mapping (voters to blind signatures)
   * @param {IAnonymousVotingContractManager} cm the contract manager for the AnonymousVoting contract
   * @returns {Observable<IRegistration>} an observable of the registration mapping or an observable that emits
   * null if there is an error
   * @private
   */
  private registration$(cm: IAnonymousVotingContractManager): Observable<IRegistration> {
    return this.pendingRegistrations$(cm)
      .switchMap(pending => pending.length > 0 ? Observable.of(null) : // the registration is invalid while there are pending registrations
        cm.registrationHashes$
          .switchMap(regHashes =>
            Observable.from(Object.keys(regHashes))
              .mergeMap(voter => this.params$(cm)
                // TODO: this seems like a redundant check (because of the pending.length check) but there is something about the timing
                // and the fact that values are getting replayed that causes this branch to be executed with null signatures
                  .filter(p => regHashes[voter].signature !== null)
                  .map(p => p.registration_key)
                  .switchMap(key => this.validateRegistration(regHashes, voter, key).pipe(this.throwIfEmpty))
              )
              .scan((L, el) => L.concat(el), [])
              .startWith([])
              .map(L => {
                const registration: IRegistration = {};
                L.map(reg => {
                  registration[reg.voter] = {blindSignature: reg.blindSignature};
                });
                return registration;
              })
          )
      )
      .catch(err => Observable.of(null));
  }

  /**
   * Retrieves the blinded address and blind signature from their IPFS hashes and verifies that they match each other
   * @param {IRegistrationHashes} regHashes the list of IPFS registration (blinded address and blind signature) hashes
   * @param {address} voter the particular voter record to check
   * @param {IRSAKey} key the registration key used to create the blind signature
   * @returns {Observable<ISingleVoterRegistration>} an observable of the voter, blindAddress and blind signature. Throws an error
   * if the hashes cannot be resolved or the blind signature doesn't match the blind address
   * @private
   */
  private validateRegistration(regHashes: IRegistrationHashes, voter: address, key: IRSAKey): Observable<ISingleVoterRegistration> {
    const blindedAddress$ = this.retrieveIPFSHash(regHashes[voter].blindedAddress, FormatValidator.blindAddressFormatError)
      .map(obj => obj.blinded_address);

    const blindSignature$ = this.retrieveIPFSHash(regHashes[voter].signature, FormatValidator.blindSignatureFormatError)
      .map(obj => obj.blinded_signature);

    return blindedAddress$.combineLatest(blindSignature$, (addr, sig) => ({
      voter: voter, blindedAddress: addr, blindSignature: sig
    }))
      .do(reg => {
        if (!this.cryptoSvc.verify(reg.blindedAddress, reg.blindSignature, key)) {
          this.errSvc.add(VoteRetrievalErrors.registration, null);
          throw new Error(null);
        }
      });
  }

  /**
   * Creates a histogram of the candidates and the number of votes they each received
   * @param {IAnonymousVotingContractManager} cm the contract manager for the AnonymousVoting contract
   * @returns {Observable<ICandidateTotal[]>} An observable of the running vote tally or an observable that
   * emits null if there is an error
   * @private
   */
  private tally(cm: IAnonymousVotingContractManager): Observable<ICandidateTotal[]> {
    return this.registration$(cm)
      .switchMap(reg => !reg ? Observable.of(null) :
        this.params$(cm)
          .map(params => params.candidates)
          .switchMap(candidates =>
            cm.voteHashes$
              .mergeMap(voteEvent => this.retrieveIPFSHash(voteEvent.voteHash, FormatValidator.voteFormatError).pipe(this.throwIfEmpty))
              .map(vote => <IVote> vote)
              .map(vote => vote.candidateIdx)
              // create a histogram of the selected candidate indices
              .scan((tally, candidateIdx) => {
                  tally[candidateIdx].count = tally[candidateIdx].count + 1;
                  return tally;
                }, candidates.map(candidate => ({candidate: candidate, count: 0}))
              )
              .startWith(candidates.map(candidate => ({candidate: candidate, count: 0})))
          )
      )
      .catch(err => Observable.of(null));
  }

  /**
   * @param {Observable<T>} obs any observable
   * @returns {Observable<T>} the input observable or throws an error if the input observable is empty
   * @private
   */
  private throwIfEmpty<T>(obs: Observable<T>): Observable<T> {
    let isEmpty: boolean = true;
    return new Observable(observer => obs.subscribe(
      (val) => {
        isEmpty = false;
        observer.next(val);
      },
      (err) => observer.error(err),
      () => {
        if (isEmpty) {
          observer.error('Observable is empty');
        } else {
          observer.complete();
        }
      }
    ));
  }

  /**
   * Prepend an empty value with status "RETRIEVING" to the source observable and then
   * apply the status "AVAILABLE" to all values or emit an "UNAVAILABLE" status if the source observable is empty or null
   * @param {Observable<T>} obs the source observable
   * @returns {Observable<IDynamicValue<T>>} an observable the wraps retrieval status information around the source observable
   * @private
   */
  private wrapRetrieval<T>(obs: Observable<T>): Observable<IDynamicValue<T>> {
    return obs
      .defaultIfEmpty(null)
      .map(val => val === null ?
        {status: RetrievalStatus.unavailable, value: null} :
        {status: RetrievalStatus.available, value: val}
      )
      .startWith({status: RetrievalStatus.retrieving, value: null});
  }
}

interface IIPFSCache {
  [hash: string]: AsyncSubject<any>;
}

