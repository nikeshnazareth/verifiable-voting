import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/pluck';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import {
  IReplacementVotingContractDetails,
  RETRIEVAL_STATUS
} from '../../core/vote-retrieval/vote-retreival.service.constants';

@Component({
  selector: 'vv-vote',
  template: `
    <div class="container" *ngIf="voteIsSelected">
      <h2>{{heading$ | async}}</h2>
      <mat-expansion-panel [disabled]="status$.pluck('registration').pluck('disabled') | async">
        <mat-expansion-panel-header>REGISTER</mat-expansion-panel-header>
        <mat-panel-description>{{status$.pluck('registration').pluck('message') | async}}</mat-panel-description>
        <vv-registration-phase [index]="index$ | async"></vv-registration-phase>
      </mat-expansion-panel>

      <mat-expansion-panel [disabled]="status$.pluck('voting').pluck('disabled') | async">
        <mat-expansion-panel-header>VOTE</mat-expansion-panel-header>
        <mat-panel-description>{{status$.pluck('voting').pluck('message') | async}}</mat-panel-description>
        <vv-voting-phase [index]="index$ | async"></vv-voting-phase>
      </mat-expansion-panel>

      <mat-expansion-panel [disabled]="status$.pluck('complete').pluck('disabled') | async">
        <mat-expansion-panel-header>RESULTS</mat-expansion-panel-header>
        <mat-panel-description>{{status$.pluck('complete').pluck('message') | async}}</mat-panel-description>
        <vv-complete-phase [index]="index$ | async"></vv-complete-phase>
      </mat-expansion-panel>
    </div>
  `,
  styleUrls: ['./vote-component.scss']
})
export class VoteComponent implements OnInit {
  public voteIsSelected: boolean;
  public index$: BehaviorSubject<number>;
  public heading$: Observable<string>;
  public status$: Observable<IPhaseStatus>;
  private _voteDetails$: ReplaySubject<IReplacementVotingContractDetails>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this.index$ = new BehaviorSubject<number>(null);
    this.voteIsSelected = false;
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    this._voteDetails$ = new ReplaySubject<IReplacementVotingContractDetails>();
    this.index$.switchMap(idx => this.voteRetrievalSvc.replacementDetailsAtIndex$(idx))
      .subscribe(this._voteDetails$);

    this.heading$ = this._voteDetails$.map(details => `${details.index}. ${details.topic.value}`);
    this.status$ = this._voteDetails$.map(details => this._getStatus(details));
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

  /**
   * Get the phase status and error messages corresponding to the specified vote details
   * @param {IReplacementVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} which forms are disabled and why
   * @private
   */
  private _getStatus(details: IReplacementVotingContractDetails): IPhaseStatus {
    if (details.phase.status === RETRIEVAL_STATUS.RETRIEVING) {
      const msg: string = `[${RETRIEVAL_STATUS.RETRIEVING}]`;
      return {
        registration: {message: msg, disabled: true},
        voting: {message: msg, disabled: true},
        complete: {message: msg, disabled: true}
      };
    }
    return {
      registration: {message: '', disabled: false},
      voting: {message: '', disabled: false},
      complete: {message: '', disabled: false}
    };
  }
}

interface IPhaseStatus {
  registration: {
    message: string;
    disabled: boolean;
  };
  voting: {
    message: string;
    disabled: boolean;
  };
  complete: {
    message: string;
    disabled: boolean;
  };
}
