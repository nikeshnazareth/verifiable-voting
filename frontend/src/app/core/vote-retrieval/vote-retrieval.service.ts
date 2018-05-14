/**
 * A service to retrieve and persist the VotingContract data available on the blockchain
 * The purpose of this service is to isolate the data retrieval logic and
 * avoid repeating the same data requests whenever the UI components are reloaded
 */

import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.api';
import { address } from '../ethereum/type.mappings';
import { IPFSService } from '../ipfs/ipfs.service';
import { IVoteParameters } from '../vote-manager/vote-manager.service';
import { ErrorService } from '../error-service/error.service';


interface IVoteRetrievalService {
  summaries$: Observable<IVotingContractSummary[]>;
}

export const VoteRetrievalServiceErrors = {
  ipfs: {
    getParametersHash: (addr, hash) => new Error('Unable to retrieve the parameters for the AnonymousVoting contract' +
      ` at ${addr} from the IPFS hash (${hash})`)
  },
  format: {
    parametersHash: (params) => new Error(`Retrieved parameters (${params}) do not match the expected format`)
  }
};

export const RETRIEVAL_STATUS = {
  UNAVAILABLE: 'UNAVAILABLE',
  RETRIEVING: 'RETRIEVING'
};

@Injectable()
export class VoteRetrievalService implements IVoteRetrievalService, OnDestroy {
  private _voteCache: IVoteCache;
  private _voteRetrievalSubscription: Subscription;

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingSvc: AnonymousVotingContractService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
    this._voteCache = {};
    this._voteRetrievalSubscription = new Subscription();
  }

  static emptyParameters(status: string): IVoteParameters {
    return {
      topic: status,
      candidates: [],
      registration_key: {
        modulus: status,
        public_exp: status
      }
    };
  }

  get summaries$(): Observable<IVotingContractSummary[]> {
    return this.voteListingSvc.deployedVotes$
      .map((addr, idx) => this._cachedVoteSummaries(addr, idx))
      .scan(
        (acc, summary$) => acc.combineLatest(summary$, (L, el) => L.concat(el)),
        Observable.of([])
      )
      .switch();
  }

  ngOnDestroy() {
    this._voteRetrievalSubscription.unsubscribe();
  }

  private _cachedVoteSummaries(addr: address, idx: number): Observable<IVotingContractSummary> {
    return this._cachedVoteDetails(addr, idx)
      .map(voteDetails => ({
        index: voteDetails.index,
        phase: voteDetails.phase,
        topic: voteDetails.parameters.topic
      }));
  }

  private _cachedVoteDetails(addr: address, idx: number): Observable<IVotingContractDetails> {
    if (!addr) {
      const empty: IVoteParameters = VoteRetrievalService.emptyParameters(RETRIEVAL_STATUS.UNAVAILABLE);
      return Observable.of({
        index: idx,
        phase: RETRIEVAL_STATUS.UNAVAILABLE,
        parameters: empty
      });
    }

    if (!this._voteCache[addr]) {
      const phase$: Observable<string> =
        this.anonymousVotingSvc.newPhaseEventsAt$(addr)
          .map(phaseIdx => VotePhases[phaseIdx])
          .defaultIfEmpty(RETRIEVAL_STATUS.UNAVAILABLE)
          .startWith(RETRIEVAL_STATUS.RETRIEVING);

      const parameters$: Observable<IVoteParameters> =
        this.anonymousVotingSvc.paramsHashAt$(addr)
          .map(hash => this.ipfsSvc.catJSON(hash).catch(err =>
            this.errSvc.add(VoteRetrievalServiceErrors.ipfs.getParametersHash(addr, hash), err)
          ))
          .switchMap(paramsPromise => Observable.fromPromise(paramsPromise))
          .map(params => params ? this.confirmParametersFormat(params) : null)
          .filter(params => params != null)
          .defaultIfEmpty(VoteRetrievalService.emptyParameters(RETRIEVAL_STATUS.UNAVAILABLE))
          .startWith(VoteRetrievalService.emptyParameters(RETRIEVAL_STATUS.RETRIEVING));

      // cache the values by subscribing exactly once and passing the values to a new observable
      this._voteCache[addr] = new EventEmitter<IVotingContractDetails>();
      const sub: Subscription = phase$.combineLatest(parameters$, (phase, parameters) => ({
        index: idx,
        phase: phase,
        parameters: parameters
      }))
        .map(details => <IVotingContractDetails> details)
        .subscribe(
          details => this._voteCache[addr].emit(details),
          err => Observable.throw(err),
          () => this._voteCache[addr].complete()
        );
      this._voteRetrievalSubscription.add(sub);
    }
    return this._voteCache[addr];
  }

  /**
   * Notifies the Error Service if the params object doesn't match the IVoteParameters interface
   * @param {Object} obj the object to check
   * @returns {IVoteParameters} the parameters object if it matches or null otherwise
   */
  private confirmParametersFormat(obj: object): IVoteParameters {
    const params: IVoteParameters = <IVoteParameters> obj;
    const valid: boolean =
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
      return <IVoteParameters> params;
    } else {
      this.errSvc.add(VoteRetrievalServiceErrors.format.parametersHash(params), null);
      return null;
    }
  }
}

interface IVotingContractSummary {
  index: number;
  phase: string;
  topic: string;
}

interface IVotingContractDetails {
  index: number;
  phase: string;
  parameters: IVoteParameters;
}

interface IVoteCache {
  [addr: string]: EventEmitter<IVotingContractDetails>;
}

