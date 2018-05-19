import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/pluck';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { IVotingContractDetails } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'vv-vote',
  template: `
    <div class="container" [hidden]="!_voteIsSelected">
      <h2>Vote #{{_index$ | async}}</h2>
      <div class="topic">{{_topic$ | async}}</div>
      <div class="phase">{{_phase$ | async}}</div>
    </div>
  `,
})
export class VoteComponent implements OnInit {
  private _voteIsSelected: boolean;
  private _index$: BehaviorSubject<number>;
  private _voteDetails$: Observable<IVotingContractDetails>;
  private _topic$: Observable<string>;
  private _phase$: Observable<string>;


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

    this._topic$ = this._voteDetails$.pluck('parameters').pluck('topic');
    this._phase$ = this._voteDetails$.pluck('phase');
  }

  /**
   * Convert the input "index" into an observable and set _voteIsSelected to enable the view
   * @param val
   */
  @Input()
  set index(val) {
    this._index$.next(val);
    this._voteIsSelected = typeof val !== 'undefined';
  }
}
