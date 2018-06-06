import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { IVotingContractDetails } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'vv-vote',
  template: `
    <div class="container" [hidden]="!_voteIsSelected">
      <h2>{{_heading$ | async}}</h2>
      <mat-expansion-panel>
        <mat-expansion-panel-header>REGISTER</mat-expansion-panel-header>
        <vv-registration-phase [index]="_index$ | async"></vv-registration-phase>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>VOTE</mat-expansion-panel-header>
        <vv-voting-phase [index]="_index$ | async"></vv-voting-phase>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>RESULTS</mat-expansion-panel-header>
        <vv-complete-phase [index]="_index$ | async"></vv-complete-phase>
      </mat-expansion-panel>
    </div>
  `,
  styleUrls: ['./vote-component.scss']
})
export class VoteComponent implements OnInit {
  private _voteIsSelected: boolean;
  private _index$: BehaviorSubject<number>;
  private _voteDetails$: Observable<IVotingContractDetails>;
  private _heading$: Observable<string>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this._index$ = new BehaviorSubject<number>(null);
    this._voteIsSelected = false;
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    this._voteDetails$ = this._index$
      .switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx));

    this._heading$ = this._voteDetails$.map(details => `${details.index}. ${details.parameters.topic}`);
  }

  /**
   * Convert the input "index" into an observable and set _voteIsSelected to enable the view
   * @param val
   */
  @Input()
  set index(val: number) {
    if (typeof val !== 'undefined') {
      this._voteIsSelected = true;
      this._index$.next(val);
    }
  }
}
