import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { ErrorService } from '../../error-service/error.service';
import { IAnonymousVotingContractCollection, Mock } from '../../../mock/module';
import { AnonymousVotingContractManager, AnonymousVotingContractManagerErrors } from './contract-manager';
import { AnonymousVotingAPI } from './contract.api';
import Spy = jasmine.Spy;

fdescribe('class: AnonymousVotingContractManager', () => {
  const contractManager = () => new AnonymousVotingContractManager(contract$, errSvc);
  let voteCollection: IAnonymousVotingContractCollection;
  let contract$: Observable<AnonymousVotingAPI>;
  let errSvc: ErrorService;

  const msPerDay: number = 1000 * 60 * 60 * 24;

  const onError = (err) => fail(err);
  let onNext: Spy;
  let onCompleted: Spy;

  beforeEach(() => {
    errSvc = new ErrorService();
    spyOn(errSvc, 'add').and.stub();

    voteCollection = Mock.AnonymousVotingContractCollections[0];
    contract$ = Observable.of(voteCollection.instance);

    onNext = jasmine.createSpy('onNext');
    onCompleted = jasmine.createSpy('onCompleted');
  });

  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(fakeAsync(() => {
    jasmine.clock().uninstall();
  }));

  describe('property: constants$', () => {
    const retrievalError = new Error('Value cannot be retrieved');

    const init_constant$_and_subscribe = () => {
      contractManager().constants$.subscribe(onNext, onError, onCompleted);
      tick();
    };

    const error_tests = () => {
      beforeEach(fakeAsync(() => init_constant$_and_subscribe()));

      it('should notify the Error Service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractManagerErrors.constants, retrievalError);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    };

    describe('case: the contract observable is empty', () => {

      beforeEach(fakeAsync(() => {
        contract$ = Observable.empty();
        init_constant$_and_subscribe();
      }));

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: parameters hash cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.parametersHash, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      error_tests();
    });

    describe('case: eligibility contract cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.eligibilityContract, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      error_tests();
    });

    describe('case: registration authority cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.registrationAuthority, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      error_tests();
    });

    describe('case: registration deadline cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.registrationDeadline, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      error_tests();
    });

    describe('case: voting deadline cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.votingDeadline, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      error_tests();
    });
  });

  describe('property: phase$', () => {

    const init_phase$_and_subscribe = () => {
      contractManager().phase$.subscribe(onNext, onError, onCompleted);
      tick();
    };

    const mostRecentPhase = () => onNext.calls.mostRecent().args[0];

    describe('case: constants$ is an empty observable', () => {

      beforeEach(fakeAsync(() => {
        contract$ = Observable.empty();
        init_phase$_and_subscribe();
      }));

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });


    describe('case: before the registration deadline', () => {
      beforeEach(() => jasmine.clock().mockDate(
        new Date(voteCollection.voteConstants.registrationDeadline - msPerDay)
      ));

      it('should start at phase 0', fakeAsync(() => {
        init_phase$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(0);
        discardPeriodicTasks();
      }));

      describe('case: the registration deadline expires', () => {
        beforeEach(fakeAsync(() => {
          init_phase$_and_subscribe();
          jasmine.clock().tick(2 * msPerDay);
          tick();
          discardPeriodicTasks();
        }));

        it('should emit the phase "1"', () => {
          expect(onNext).toHaveBeenCalledTimes(2);
          expect(mostRecentPhase()).toEqual(1);
        });
      });

      describe('case: the voting deadline expires', () => {
        beforeEach(fakeAsync(() => {
          init_phase$_and_subscribe();
          jasmine.clock().tick(20 * msPerDay);
          tick();
          discardPeriodicTasks();
        }));

        it('should emit the phase "2"', () => {
          expect(onNext).toHaveBeenCalledTimes(3);
          expect(mostRecentPhase()).toEqual(2);
        });

        it('should complete', () => {
          expect(onCompleted).toHaveBeenCalled();
        });
      });
    });

    describe('case: during the voting phase', () => {
      beforeEach(() => jasmine.clock().mockDate(
        new Date(voteCollection.voteConstants.registrationDeadline + msPerDay)
      ));

      it('should immediately emit phases "0" and "1"', fakeAsync(() => {
        init_phase$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(2);
        expect(onNext).toHaveBeenCalledWith(0);
        expect(mostRecentPhase()).toEqual(1);
        discardPeriodicTasks();
      }));

      describe('case: the voting deadline expires', () => {
        beforeEach(fakeAsync(() => {
          init_phase$_and_subscribe();
          jasmine.clock().tick(20 * msPerDay);
          tick();
          discardPeriodicTasks();
        }));

        it('should emit the phase "2"', () => {
          expect(onNext).toHaveBeenCalledTimes(3);
          expect(mostRecentPhase()).toEqual(2);
        });

        it('should complete', () => {
          expect(onCompleted).toHaveBeenCalled();
        });
      });
    });

    describe('case: after the voting phase', () => {
      beforeEach(() => jasmine.clock().mockDate(new Date(voteCollection.voteConstants.votingDeadline + msPerDay)));

      beforeEach(fakeAsync(() => init_phase$_and_subscribe()));

      it('should immediately emit phases "0" and "1" amd "2"', () => {
        expect(onNext).toHaveBeenCalledTimes(3);
        expect(onNext).toHaveBeenCalledWith(0);
        expect(onNext).toHaveBeenCalledWith(1);
        expect(mostRecentPhase()).toEqual(2);
      });

      it('should complete', () => {
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});
