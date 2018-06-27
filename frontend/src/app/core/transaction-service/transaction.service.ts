import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { ITransactionReceipt } from '../ethereum/transaction.interface';
import { ITransactionState, TransactionStatus } from './transaction-state.interface';

@Injectable()
export class TransactionService implements ITransactionService {
  private transaction$: ReplaySubject<Observable<ITransactionState>>;

  constructor() {
    this.transaction$ = new ReplaySubject<Observable<ITransactionState>>();
  }

  /**
   * Executes the specified transaction, and wraps the result in a ITransactionState observable with the specified description
   * Adds the observable to the global transaction$ subject
   * @param {Observable<ITransactionReceipt>} tx the transaction to execute (should return a receipt or be empty on failure)
   * @param {string} description a description of the transaction that can be displayed to the user
   */
  add(tx: Observable<ITransactionReceipt>, description: string): void {
    const state$: ReplaySubject<ITransactionState> = new ReplaySubject<ITransactionState>();
    tx.map(receipt => TransactionStatus.success)
      .defaultIfEmpty(TransactionStatus.failure)
      .startWith(TransactionStatus.pending)
      .map(status => ({description: description, status: status}))
      .subscribe(state$);
    this.transaction$.next(state$);
  }

  /**
   * Flattens transaction$ to emit an array of transaction states (one record per original tx)
   * @returns {Observable<ITransactionState[]>} an observable of an array of the current transaction states
   */
  get transactionStates$(): Observable<ITransactionState[]> {
    return this.transaction$
      .scan(
        (arr$, txState$) => arr$.combineLatest(txState$, (L, txState) => L.concat(txState)),
        Observable.of([])
      )
      .switch()
      .startWith([]);
  }
}

interface ITransactionService {
  transactionStates$: Observable<ITransactionState[]>;

  add(tx: Observable<ITransactionReceipt>, description: string): void;
}
