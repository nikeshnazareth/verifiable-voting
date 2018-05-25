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

import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.api';
import { address } from '../ethereum/type.mappings';
import { IPFSService } from '../ipfs/ipfs.service';
import { IVoteParameters } from '../vote-manager/vote-manager.service';
import { ErrorService } from '../error-service/error.service';
import {
  IDynamicValue,
  IVotingContractDetails, IVotingContractSummary, RETRIEVAL_STATUS,
  VoteRetrievalServiceErrors
} from './vote-retreival.service.constants';

export interface IVoteRetrievalService {
  summaries$: Observable<IVotingContractSummary[]>;

  detailsAtIndex$(idx: number): Observable<IVotingContractDetails>;
}

@Injectable()
export class VoteRetrievalService implements IVoteRetrievalService {
  private _voteCache: IVoteCache;

  constructor(private voteListingSvc: VoteListingContractService,
              private anonymousVotingSvc: AnonymousVotingContractService,
              private ipfsSvc: IPFSService,
              private errSvc: ErrorService) {
    this._voteCache = {};
  }

  /**
   * Retrieves the vote summary information (from cache if possible) for each deployed
   * contract in the VoteListingService.
   * Merges them all into a single array and emits the result
   * @returns {Observable<IVotingContractSummary[]>} the summary of all deployed voting contracts<br/>
   * including intermediate and error states
   */
  get summaries$(): Observable<IVotingContractSummary[]> {
    return this.voteListingSvc.deployedVotes$
      .map((addr, idx) => this._getVoteSummary(addr, idx))
      .scan(
        (acc, summary$) => acc.combineLatest(summary$, (L, el) => L.concat(el)),
        Observable.of([])
      )
      .switch();
  }

  /**
   * Retrieves the vote information (from cache if possible) for the specified contract
   * @param {number} idx the index of the AnonymousVoting contract in the VoteListingContract
   * @returns {Observable<IVotingContractDetails>} an observable of the vote details <br/>
   * including intermediate and error states
   */
  detailsAtIndex$(idx: number): Observable<IVotingContractDetails> {
    return this.voteListingSvc.deployedVotes$
      .filter((addr, _idx) => _idx === idx)
      .defaultIfEmpty(null)
      .switchMap(addr => this._getVoteDetails(addr, idx));
  }

  /**
   * Obtains the vote details for the specified AnonmyousVoting contract (from cache if possible)
   * and summarises them
   * @param {address} addr the address of the contract
   * @param {number} idx the index of the contract in the VoteListingContract array
   * @returns {Observable<IVotingContractSummary>} (an observable of) a summary of the vote <br/>
   * or a placeholder value if the information cannot be retrieved
   * @private
   */
  private _getVoteSummary(addr: address, idx: number): Observable<IVotingContractSummary> {
    return this._getVoteDetails(addr, idx)
      .map(voteDetails => this.summarise(voteDetails));
  }

  /**
   * Obtains the vote details for the specified AnonymousVoting contract (from cache if possible)
   * @param {address} addr the address of the contract
   * @param {number} idx the index of the contract in the VoteListingContract array
   * @returns {Observable<IVotingContractDetails>} (an observable of) the vote details <br/>
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
          this.errSvc.add(VoteRetrievalServiceErrors.ipfs.getParametersHash(addr), err);
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

      this._voteCache[addr] = phase$.combineLatest(
        parameters$,
        regDeadline$,
        votingDeadline$,
        (phase, parameters, regDeadline, votingDeadline) =>
          this.newContractDetails(idx, addr, phase, parameters, regDeadline, votingDeadline)
      )
        .shareReplay(1);
    }
    return this._voteCache[addr];
  }

  /**
   * Notifies the Error Service if the params object doesn't match the IVoteParameters interface
   * @param {Object} obj the object to check
   * @returns {IVoteParameters} the parameters object if it matches or null otherwise
   */
  private _confirmParametersFormat(obj: object): IVoteParameters {
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

  /**
   * @param {number} idx the index of the contract in the VoteListingContract array
   * @param {string} placeholder a placeholder value for all string properties
   * @returns {IVotingContractDetails} a stub IVotingContractDetails object<br/>
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
   * @returns {IVotingContractDetails} a new IVotingContractDetails object with the specified values
   */
  private newContractDetails(index, addr, phase, parameters, regDeadline, votingDeadline): IVotingContractDetails {
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
        status: typeof votingDeadline === 'string' ? votingDeadline: RETRIEVAL_STATUS.AVAILABLE,
        value: typeof votingDeadline === 'string' ? null : votingDeadline
      }
    };
  }

  /**
   * @param {IVotingContractDetails} details the details of a vote
   * @returns {IVotingContractSummary} a summarised version that can be displayed in an aggregate list
   */
  private summarise(details: IVotingContractDetails): IVotingContractSummary {
    return {
      index: details.index,
      address: details.address,
      phase: details.phase,
      topic: details.parameters.topic
    };
  }
}

interface IVoteCache {
  [addr: string]: Observable<IVotingContractDetails>;
}

