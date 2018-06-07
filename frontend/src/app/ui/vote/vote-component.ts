import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { IVotingContractDetails } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'vv-vote',
  template: `
    <div class="container" [hidden]="!voteIsSelected">
      <h2>{{heading$ | async}}</h2>
      <mat-expansion-panel>
        <mat-expansion-panel-header>REGISTER</mat-expansion-panel-header>
        <vv-registration-phase [index]="index$ | async"></vv-registration-phase>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>VOTE</mat-expansion-panel-header>
        <vv-voting-phase [index]="index$ | async"></vv-voting-phase>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>RESULTS</mat-expansion-panel-header>
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

  private _voteDetails$: Observable<IVotingContractDetails>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this.index$ = new BehaviorSubject<number>(null);
    this.voteIsSelected = false;
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    this._voteDetails$ = this.index$
      .switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx));

    this.heading$ = this._voteDetails$.map(details => `${details.index}. ${details.parameters.topic}`);
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
