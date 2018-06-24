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
  template: `
    <mat-table [dataSource]="contractsSummary$ | async">
      <!-- Index column -->
      <ng-container matColumnDef="index">
        <mat-header-cell *matHeaderCellDef>#</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ contract.index }}</mat-cell>
      </ng-container>

      <!-- Phase column -->
      <ng-container matColumnDef="phase">
        <mat-header-cell *matHeaderCellDef>Phase</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ displayString(contract.phase) }}</mat-cell>
      </ng-container>

      <!-- Topic column -->
      <ng-container matColumnDef="topic">
        <mat-header-cell *matHeaderCellDef>Topic</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ displayString(contract.topic) }}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; columns: displayedColumns" (click)="_rowClicked$.emit(row.index)"></mat-row>
    </mat-table>
  `,
  styleUrls: ['./list-votes.component.scss']
})
export class ListVotesComponent implements OnInit {
  @Output() selectedContract$: Observable<number>;
  public contractsSummary$: Observable<IVotingContractSummary[]>;
  public displayedColumns: string[] = ['index', 'phase', 'topic'];

  private _rowClicked$: EventEmitter<number>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this._rowClicked$ = new EventEmitter<number>();
    this.selectedContract$ = this._initialiseSelectedContract$();
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
  private _initialiseSelectedContract$(): Observable<number> {
    return this._rowClicked$
      .withLatestFrom(this.voteRetrievalSvc.summaries$)
      .map(([idx, summaries]) => summaries[idx])
      .filter(summary => summary.address.status === RETRIEVAL_STATUS.AVAILABLE)
      .filter(summary => summary.phase.status === RETRIEVAL_STATUS.AVAILABLE)
      .filter(summary => summary.topic.status === RETRIEVAL_STATUS.AVAILABLE)
      .map(summary => summary.index);
  }
}
