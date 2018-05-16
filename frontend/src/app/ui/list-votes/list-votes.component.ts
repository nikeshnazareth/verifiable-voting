import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/combineLatest';

import { IVotingContractSummary, VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';

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
      <mat-row *matRowDef="let row; columns: _displayedColumns" (click)="selectedContract$.emit(row.index)"></mat-row>
    </mat-table>
  `,
  styleUrls: ['./list-votes.component.scss']
})
export class ListVotesComponent implements OnInit {
  @Output() selectedContract$: EventEmitter<number>;

  private _contractsSummary$: Observable<IVotingContractSummary[]>;
  private _displayedColumns: string[] = ['index', 'phase', 'topic'];

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this.selectedContract$ = new EventEmitter<number>();
  }

  /**
   * Initialise the table data source
   */
  ngOnInit() {
    this._contractsSummary$ = this.voteRetrievalSvc.summaries$;
  }
}
