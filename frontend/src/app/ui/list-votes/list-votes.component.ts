import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { IVotingContractSummary, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import 'rxjs/add/operator/withLatestFrom';

@Component({
  selector: 'vv-list-votes',
  template: `
    <mat-table [dataSource]="_contractsSummary$ | async">
      <!-- Index column -->
      <ng-container matColumnDef="index">
        <mat-header-cell *matHeaderCellDef>#</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ contract.index }}</mat-cell>
      </ng-container>

      <!-- Phase column -->
      <ng-container matColumnDef="phase">
        <mat-header-cell *matHeaderCellDef>Phase</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ contract.phase }}</mat-cell>
      </ng-container>

      <!-- Topic column -->
      <ng-container matColumnDef="topic">
        <mat-header-cell *matHeaderCellDef>Topic</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ contract.topic }}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="_displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; columns: _displayedColumns" (click)="_rowClicked$.emit(row.index)"></mat-row>
    </mat-table>
  `,
  styleUrls: ['./list-votes.component.scss']
})
export class ListVotesComponent implements OnInit {
  @Output() selectedContract$: Observable<number>;

  private _contractsSummary$: Observable<IVotingContractSummary[]>;
  private _displayedColumns: string[] = ['index', 'phase', 'topic'];
  private _rowClicked$: EventEmitter<number>;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this._rowClicked$ = new EventEmitter<number>();
  }

  /**
   * Initialise the table data source
   */
  ngOnInit() {
    this._contractsSummary$ = this.voteRetrievalSvc.summaries$;
    this.selectedContract$ = this._initialiseSelectedContract$();
  }

  /**
   * Pass through row click events when the row is complete
   * @returns {Observable<number>}
   * @private
   */
  private _initialiseSelectedContract$(): Observable<number> {
    return this._rowClicked$
      .withLatestFrom(this._contractsSummary$)
      .map(([idx, summaries]) => summaries[idx])
      .filter(summary => this.isCompleteSummary(summary))
      .map(summary => summary.index);
  }

  /**
   * @param {IVotingContractSummary} summary a VotingContract summary to check
   * @returns {boolean} whether all of the fields are retrieved and available
   */
  private isCompleteSummary(summary: IVotingContractSummary): boolean {
    return summary.phase !== RETRIEVAL_STATUS.RETRIEVING &&
      summary.phase !== RETRIEVAL_STATUS.UNAVAILABLE &&
      summary.topic !== RETRIEVAL_STATUS.RETRIEVING &&
      summary.topic !== RETRIEVAL_STATUS.UNAVAILABLE;
  }
}
