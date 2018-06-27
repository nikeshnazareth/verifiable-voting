import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import Spy = jasmine.Spy;
import { ITransactionState, TransactionStatus } from './transaction-state.interface';
import { TransactionService } from './transaction.service';

describe('Service: TransactionService', () => {
  let txSvc: TransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransactionService
      ]
    });

    txSvc = TestBed.get(TransactionService);
  });

  const onError = err => fail(err);
  let onNext: Spy;
  let onCompleted: Spy;

  beforeEach(() => {
    onNext = jasmine.createSpy('onNext');
    onCompleted = jasmine.createSpy('onCompleted');
    txSvc.transactionStates$.subscribe(onNext, onError, onCompleted);
  });

  const latest = () => <ITransactionState[]> onNext.calls.mostRecent().args[0];

  describe('method: transactionStates$', () => {
    it('should start with an empty array', () => {
      expect(latest()).toEqual([]);
    });

    describe('case: A transaction is initated', () => {
      const description: string = 'A pending transaction';

      beforeEach(() => txSvc.add(Observable.never(), description));

      it(`should emit an array with a ${TransactionStatus.pending} state and the supplied description`, () => {
        expect(latest().length).toEqual(1);
        expect(latest()[0].status).toEqual(TransactionStatus.pending);
        expect(latest()[0].description).toEqual(description);
      });
    });

    describe('case: Three transactions are initiated', () => {
      const description: string[] = Array(3).fill(0).map((_, idx) => `A pending transaction ${idx}`);

      beforeEach(() => description.forEach(desc =>
        txSvc.add(Observable.never(), desc)
      ));

      it(`should emit an array with a ${TransactionStatus.pending} state and the supplied description`, () => {
        expect(latest().length).toEqual(3);
        latest().forEach((state, idx) => {
          expect(state.status).toEqual(TransactionStatus.pending);
          expect(state.description).toEqual(description[idx]);
        });
      });
    });

    describe('case: the third transaction succeeds', () => {
      const description: string[] = Array(3).fill(0).map((_, idx) => `Transaction ${idx}`);

      beforeEach(() => {
        txSvc.add(Observable.never(), description[0]);
        txSvc.add(Observable.never(), description[1]);
        txSvc.add(Observable.of('MOCK_RECEIPT'), description[2]);
      });

      it(`should not affect the first two transactions (they still show ${TransactionStatus.pending})`, () => {
        expect(latest().length).toEqual(3);
        [0, 1].forEach(idx => {
          expect(latest()[idx].status).toEqual(TransactionStatus.pending);
          expect(latest()[idx].description).toEqual(description[idx]);
        });
      });

      it(`should update the third transaction to show ${TransactionStatus.success}`, () => {
        expect(latest()[2].status).toEqual(TransactionStatus.success);
        expect(latest()[2].description).toEqual(description[2]);
      });
    });

    describe('case: the second transaction fail', () => {
      const description: string[] = Array(3).fill(0).map((_, idx) => `Transaction ${idx}`);

      beforeEach(() => {
        txSvc.add(Observable.never(), description[0]);
        txSvc.add(Observable.empty(), description[1]);
        txSvc.add(Observable.of('MOCK_RECEIPT'), description[2]);
      });

      it(`should not affect the first transaction (it still shows ${TransactionStatus.pending})`, () => {
        expect(latest()[0].status).toEqual(TransactionStatus.pending);
        expect(latest()[0].description).toEqual(description[0]);
      });

      it(`should update the second transaction to show ${TransactionStatus.failure}`, () => {
        expect(latest()[1].status).toEqual(TransactionStatus.failure);
        expect(latest()[1].description).toEqual(description[1]);
      });

      it(`should not affect the third transaction (it still shows ${TransactionStatus.success})`, () => {
        expect(latest()[2].status).toEqual(TransactionStatus.success);
        expect(latest()[2].description).toEqual(description[2]);
      });
    });

    describe('case: there are multiple subscribers', () => {
      let arbitraryFn;
      let secondHandler;
      const description: string = 'The description';

      beforeEach(() => {
        arbitraryFn = jasmine.createSpy('arbitrary').and.stub();
        secondHandler = jasmine.createSpy('second handler').and.stub();

        txSvc.add(Observable.of(arbitraryFn()), description);
        txSvc.transactionStates$.subscribe(secondHandler);
      });

      it('should return the results on both subscribers', () => {
        expect(latest().length).toEqual(1);
        expect(latest()[0].status).toEqual(TransactionStatus.success);
        expect(latest()[0].description).toEqual(description);

        const second: ITransactionState[] = secondHandler.calls.mostRecent().args[0];
        expect(second.length).toEqual(1);
        expect(second[0].status).toEqual(TransactionStatus.success);
        expect(second[0].description).toEqual(description);
      });

      it('should only call the transaction once', () => {
        expect(arbitraryFn).toHaveBeenCalledTimes(1);
      });
    });
  });
});
