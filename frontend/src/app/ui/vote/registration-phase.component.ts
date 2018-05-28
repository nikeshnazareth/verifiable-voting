import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';

export const RegistrationPhaseComponentMessages = {
  retrieving: 'Retrieving the contract details...',
  unavailable: 'The contract details are unavailable. Please try again later',
  closed: 'Registration has closed'
};

@Component({
  selector: 'vv-registration-phase',
  template: `
    <div id="register" *ngIf="_inRegistrationPhase$ | async; else unavailable"></div>
    <ng-template #unavailable>
      <div id="unavailable">{{_message$ | async}}</div>
    </ng-template>
  `,
})
export class RegistrationPhaseComponent implements OnInit {
  private _index$: BehaviorSubject<number>;
  private _inRegistrationPhase$: Observable<boolean>;
  private _message$: Observable<string>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this._index$ = new BehaviorSubject<number>(null);
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    const _voteDetails$: Observable<IVotingContractDetails> = this._index$
      .switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx))
      .shareReplay(1);

    this._inRegistrationPhase$ = _voteDetails$.map(details => this._inRegistrationPhase(details));
    this._message$ = _voteDetails$.filter(details => !this._inRegistrationPhase(details))
      .map(details => this._chooseMessage(details));
  }

  /**
   * Convert the input "index" into an observable
   * @param val
   */
  @Input()
  set index(val: number) {
    this._index$.next(val);
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the vote is in the Registration phase
   * @private
   */
  private _inRegistrationPhase(voteDetails: IVotingContractDetails): boolean {
    const now = new Date();
    return voteDetails.phase === VotePhases[0] &&
      voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.AVAILABLE &&
      voteDetails.registrationDeadline.value &&
      now < voteDetails.registrationDeadline.value;
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {string} the message to display to the user explaining why they cannot register at the moment
   * @private
   */
  private _chooseMessage(voteDetails: IVotingContractDetails): string {
    if (this._isRetrieving(voteDetails)) {
      return RegistrationPhaseComponentMessages.retrieving;
    } else if (this._isUnavailable(voteDetails)) {
      return RegistrationPhaseComponentMessages.unavailable;
    } else if (this._regDeadlinePassed(voteDetails) || voteDetails.phase !== VotePhases[0]) {
      return RegistrationPhaseComponentMessages.closed;
    } else {
      return null;
    }
 }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the vote phase or registration deadline are still being retrieved
   * @private
   */
  private _isRetrieving(voteDetails: IVotingContractDetails): boolean {
    return voteDetails.phase === RETRIEVAL_STATUS.RETRIEVING ||
      voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.RETRIEVING;
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the vote phase or registration deadline are unavailable
   * @private
   */
  private _isUnavailable(voteDetails: IVotingContractDetails): boolean {
    return voteDetails.phase === RETRIEVAL_STATUS.UNAVAILABLE ||
      voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.UNAVAILABLE;
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the registration deadline has already passed
   * @private
   */
  private _regDeadlinePassed(voteDetails: IVotingContractDetails): boolean {
    const now: Date = new Date();
    return voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.AVAILABLE &&
      voteDetails.registrationDeadline.value &&
      voteDetails.registrationDeadline.value < now;
  }
}
