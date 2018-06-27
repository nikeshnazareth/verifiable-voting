import { Component, Input, OnInit } from '@angular/core';
import 'rxjs/add/operator/pluck';
import { Observable } from 'rxjs/Observable';
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
  public heading$: Observable<string>;
  public status$: Observable<IPhaseStatus>;
  public voteDetails$: ReplaySubject<IVotingContractDetails>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this.index$ = new ReplaySubject<number>();
    this.voteIsSelected = false;
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    this.voteDetails$ = new ReplaySubject<IVotingContractDetails>();
    this.index$.switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx))
      .subscribe(this.voteDetails$);

    this.heading$ = this.voteDetails$.map(details => `${details.index}. ${details.topic.value}`);
    this.status$ = this.voteDetails$.map(details => VoteComponentMessages.status(details));
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


