import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/combineLatest';

import { address, uint } from '../../core/ethereum/type.mappings';
import { VoteListingContractService } from '../../core/ethereum/vote-listing-contract/contract.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';


@Component({
  selector: 'vv-list-votes',
  template: `
    <h2>Deployed Votes</h2>
    <mat-table [dataSource]="_contractsSummary$ | async">
      <!-- Index column -->
      <ng-container matColumnDef="index">
        <mat-header-cell *matHeaderCellDef>#</mat-header-cell>
        <mat-cell *matCellDef="let contract">{{ contract.index }}</mat-cell>
      </ng-container>

      <!-- Parameters column -->
      <ng-container matColumnDef="parameters">
        <mat-header-cell *matHeaderCellDef>Parameters</mat-header-cell>
        <mat-cell *matCellDef="let contract"> {{ contract.parameters }}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="_displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; let i = index; columns: _displayedColumns"></mat-row>
    </mat-table>
  `
})
export class ListVotesComponent implements OnInit {
  private _contractsSummary$: Observable<IVotingContractSummary[]>;
  private _displayedColumns: string[] = ['index', 'parameters'];

  constructor(private voteListingSvc: VoteListingContractService,
              private voteManagerSvc: VoteManagerService) {
  }

  ngOnInit() {
    this._contractsSummary$ = this.initContractSummary$();
  }

  /**
   * Create an observable that retrieves the deployed vote addresses (from the VoteListingContract service)
   * and maps them to contract summary objects.
   * @returns {Observable<IVotingContractSummary[]>} A stream of contract summaries for all deployed votes<br/>
   * or error messages if they could not be retrieved
   */
  private initContractSummary$(): Observable<IVotingContractSummary[]> {
    return this.voteListingSvc
      .deployedVotes$
      .map((addr, idx) => this.getContractSummary$(idx, addr))
      // create an observable that takes the latest IVotingContractSummary element per summary stream
      // and emits an array of the results (one element per contract address)
      .scan(
        (acc, summary$) => acc.combineLatest(summary$, (L, el) => L.concat(el)),
        Observable.of([])
      )
      // flatten the observable of observable
      .switch();
  }

  /**
   * Creates an IVotingContract with parameters initialised to 'RETRIEVING...' before being replaced
   * by the actual parameters when they are retrieved. It may be replaced with 'HASH UNAVAILABLE' or
   * 'UNKNOWN CONTRACT ADDRESS' if an error occurs.
   * @param {number} idx the index of the contract
   * @param {address} addr the address of the contract
   * @returns {Observable<IVotingContractSummary>} an Observable that emits an IVotingContract where<br/>
   * the parameters reflect the status until they are retrieved.
   */
  private getContractSummary$(idx: number, addr: address): Observable<IVotingContractSummary> {
    const status$: Observable<string> = addr ?
      this.voteManagerSvc.getParameters$(addr)
        .map(parameters => parameters.parameters)
        .defaultIfEmpty('HASH UNAVAILABLE')
        .startWith('RETRIEVING...') :
      Observable.of('UNKNOWN CONTRACT ADDRESS');

    return status$.map(params => ({
      index: idx,
      parameters: params
    }));
  }
}

interface IVotingContractSummary {
  index: uint;
  parameters: string;
}
