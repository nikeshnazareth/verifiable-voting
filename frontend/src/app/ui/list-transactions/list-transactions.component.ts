import { Component } from '@angular/core';
import { TransactionStatus } from '../../core/transaction-service/transaction-state.interface';
import { TransactionService } from '../../core/transaction-service/transaction.service';

@Component({
  selector: 'vv-list-transactions',
  templateUrl: './list-transactions.component.html',
  styleUrls: ['./list-transactions.component.scss']
})
export class ListTransactionsComponent {
  public displayedColumns: string[] = ['description'];
  public txStatus;

  constructor(public txSvc: TransactionService) {
    this.txStatus = TransactionStatus;
  }
}
