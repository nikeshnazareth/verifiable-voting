import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/withLatestFrom';
import {
  IDynamicValue, IVotingContractSummary,
  RETRIEVAL_STATUS
} from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';

@Component({
  selector: 'vv-list-votes',
  templateUrl: './list-votes.component.html',
  styleUrls: ['./list-votes.component.scss']
})
export class ListVotesComponent implements OnInit {
  @Output() selectedContract$: Observable<number>;
  public contractsSummary$: Observable<IVotingContractSummary[]>;
  public displayedColumns: string[] = ['index', 'phase', 'topic'];

  private rowClicked$: EventEmitter<number>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this.rowClicked$ = new EventEmitter<number>();
    this.selectedContract$ = this.initialiseSelectedContract$();
  }

  ngOnInit() {
    this.contractsSummary$ = this.voteRetrievalSvc.summaries$;
  }

  /**
   * @param {IDynamicValue<string>} dynamicString the string to be displayed (along with status information)
   * @returns {string} the string value if it is available or the status value if not
   */
  public displayString(dynamicString: IDynamicValue<string>): string {
    return dynamicString.status === RETRIEVAL_STATUS.AVAILABLE ?
      dynamicString.value :
      dynamicString.status;
  }

  /**
   * Pass through row click events when the row is complete
   * @returns {Observable<number>}
   * @private
   */
  private initialiseSelectedContract$(): Observable<number> {
    return this.rowClicked$
      .withLatestFrom(this.voteRetrievalSvc.summaries$)
      .map(([idx, summaries]) => summaries[idx])
      .filter(summary => summary.address.status === RETRIEVAL_STATUS.AVAILABLE)
      .filter(summary => summary.phase.status === RETRIEVAL_STATUS.AVAILABLE)
      .filter(summary => summary.topic.status === RETRIEVAL_STATUS.AVAILABLE)
      .map(summary => summary.index);
  }
}
