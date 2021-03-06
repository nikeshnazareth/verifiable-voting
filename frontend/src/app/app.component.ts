import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';

import { Observable } from 'rxjs/Observable';
import { ErrorService } from './core/error-service/error.service';
import { Web3Service } from './core/ethereum/web3.service';
import { TransactionService } from './core/transaction-service/transaction.service';
import { WindowSizeService } from './core/window-size/window-size.service';

@Component({
  selector: 'vv-root',
  template: `
    <div class="mat-typography">
      <mat-toolbar color="primary">
        <h1>Verifiable Voting</h1>
      </mat-toolbar>
      <div *ngIf="isMobile$ | async;else main_content">
        <vv-mobile-view></vv-mobile-view>
      </div>
      <ng-template #main_content>
        <!-- @.disabled refers to the tab slide-in and slide-out animation -->
        <mat-tab-group [@.disabled]="true">
          <mat-tab label="Deployed Votes" *ngIf="isOnRinkeby$ | async; else connect">
            <vv-list-votes (selectedContract$)="voteSelected = $event"></vv-list-votes>
            <vv-vote [index]="voteSelected"></vv-vote>
          </mat-tab>
          <mat-tab label="Create new vote" *ngIf="isOnRinkeby$ | async">
            <vv-launch-vote></vv-launch-vote>
          </mat-tab>
          <mat-tab [disabled]="!(numTransactions$ | async)" *ngIf="isOnRinkeby$ | async">
            <ng-template mat-tab-label>
              <span [matBadge]="numTransactions$ | async" matBadgeOverlap="false">Transactions</span>
            </ng-template>
            <vv-list-transactions></vv-list-transactions>
          </mat-tab>
          <ng-template #connect>
            <mat-tab label="Connect to Ethereum">
              <vv-connect-ethereum></vv-connect-ethereum>
            </mat-tab>
          </ng-template>
          <mat-tab label="How it works">
            <vv-explanation></vv-explanation>
          </mat-tab>
          <mat-tab label="[ Registration Authority only ]" *ngIf="isOnRinkeby$ | async">
            <vv-complete-registration></vv-complete-registration>
          </mat-tab>
          <mat-tab label="Disclaimer">
            <vv-disclaimer></vv-disclaimer>
          </mat-tab>
        </mat-tab-group>
      </ng-template>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public voteSelected: number;
  public numTransactions$: Observable<number>;
  public isMobile$: Observable<boolean>;
  public isOnRinkeby$: Observable<boolean>;

  constructor(private errSvc: ErrorService,
              private snackBar: MatSnackBar,
              private txSvc: TransactionService,
              private web3Svc: Web3Service,
              private windowSizeSvc: WindowSizeService) {

    this.errSvc.error$
      .filter(err => err.friendly != null)
      .do(err => err.detailed ? console.log(err.detailed) : null)
      .map(err => err.friendly.message)
      .distinctUntilChanged()
      .concatMap(msg => this.snackBar.open(msg, 'CLOSE').onAction())
      .subscribe();

    this.isMobile$ = this.windowSizeSvc.isMobile$;
    this.isOnRinkeby$ = this.web3Svc.network$.map(name => name === 'rinkeby')
      .defaultIfEmpty(false);
  }

  ngOnInit() {
    this.numTransactions$ = this.txSvc.transactionStates$.map(states => states.length);
  }
}
