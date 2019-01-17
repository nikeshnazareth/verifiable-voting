import { Component, Input, OnInit } from '@angular/core';
import 'rxjs/add/operator/pluck';
import { Observable } from 'rxjs/Observable';
import { map, switchMap } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { IVotingContractDetails, } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { IPhaseStatus, VoteComponentMessages } from './vote-component-messages';

@Component({
  selector: 'vv-vote',
  templateUrl: './vote-component.html',
  styleUrls: ['./vote-component.scss']
})
export class VoteComponent implements OnInit {
  public voteIsSelected: boolean;
  public index$: ReplaySubject<number>;
  public voteDetails$: ReplaySubject<IVotingContractDetails>;
  public registrationStatus$: ReplaySubject<IPhaseStatus>;
  public votingStatus$: ReplaySubject<IPhaseStatus>;
  public resultsStatus$: ReplaySubject<IPhaseStatus>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this.index$ = new ReplaySubject<number>();
    this.voteIsSelected = false;
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    this.voteDetails$ = new ReplaySubject<IVotingContractDetails>();
    this.registrationStatus$ = new ReplaySubject<IPhaseStatus>();
    this.votingStatus$ = new ReplaySubject<IPhaseStatus>();
    this.resultsStatus$ = new ReplaySubject<IPhaseStatus>();

    this.index$.pipe(switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx)))
      .subscribe(this.voteDetails$);

    this.voteDetails$.pipe(map(details => VoteComponentMessages.registrationStatus(details)))
      .subscribe(this.registrationStatus$);

    this.voteDetails$.pipe(switchMap(details => VoteComponentMessages.votingStatus$(details)))
      .subscribe(this.votingStatus$);

    this.voteDetails$.pipe(map(details => VoteComponentMessages.resultsStatus(details)))
      .subscribe(this.resultsStatus$);
  }

  get heading$() {
    return this.voteDetails$.pipe(map(details => `${details.index}. ${details.topic.value}`));
  }

  getProperty$(prop: string) {
    return this.voteDetails$.pipe(map(details => details[prop].value));
  }

  get registration$$() {
    return this.voteDetails$.pipe(map(details => details.registration$$));
  }

  getMessage$(status$: ReplaySubject<IPhaseStatus>): Observable<string> {
    return status$.pipe(map(status => status.message));
  }

  isDisabled$(status$: ReplaySubject<IPhaseStatus>): Observable<boolean> {
    return status$.pipe(map(status => status.disabled));
  }

  /**
   * Convert the input "index" into an observable and set _voteIsSelected to enable the view
   * @param val
   */
  @Input()
  set index(val: number) {
    if (typeof val !== 'undefined') {
      this.voteIsSelected = true;
      this.index$.next(val);
    }
  }
}
