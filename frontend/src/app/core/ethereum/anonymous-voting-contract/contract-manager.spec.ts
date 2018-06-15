import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { ErrorService } from '../../error-service/error.service';
import { IAnonymousVotingContractCollection, Mock } from '../../../mock/module';
import { AnonymousVotingContractManager, AnonymousVotingContractManagerErrors } from './contract-manager';
import { AnonymousVotingAPI, NewPhaseEvent } from './contract.api';
import { BigNumber } from '../../../mock/bignumber';
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

  describe('property: phase$', () => {
    const retrievalError = new Error('Value cannot be retrieved');

    const init_phase$_and_subscribe = () => {
      contractManager().phase$.subscribe(onNext, onError, onCompleted);
      tick();
    };

    const triggerPhaseEvent = (phase) => {
      voteCollection.eventStream.trigger(null, {
        event: NewPhaseEvent.name,
        args: {
          phase: new BigNumber(phase)
        }
      });
    };

    const mostRecentPhase = () => onNext.calls.mostRecent().args[0];

    const vote_constant_error_tests = () => {
      beforeEach(fakeAsync(() => init_phase$_and_subscribe()));

      it('should notify the Error Service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractManagerErrors.constants, retrievalError);
      });

      it('should not respond to new events', () => {
        triggerPhaseEvent(1);
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).not.toHaveBeenCalled();
      });
    };

    describe('case: the contract observable is empty', () => {

      beforeEach(fakeAsync(() => {
        contract$ = Observable.empty();
        init_phase$_and_subscribe();
      }));

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: parameters hash cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.parametersHash, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      vote_constant_error_tests();
    });

    describe('case: eligibility contract cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.eligibilityContract, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      vote_constant_error_tests();
    });

    describe('case: registration authority cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.registrationAuthority, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      vote_constant_error_tests();
    });

    describe('case: registration deadline cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.registrationDeadline, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      vote_constant_error_tests();
    });

    describe('case: voting deadline cannot be retrieved', () => {
      beforeEach(() => spyOn(voteCollection.instance.votingDeadline, 'call').and
        .returnValue(Promise.reject(retrievalError)));
      vote_constant_error_tests();
    });

    describe('case: before the registration deadline', () => {
      beforeEach(() => jasmine.clock().mockDate(
        new Date(voteCollection.voteConstants.registrationDeadline - msPerDay)
      ));

      describe('case: before any NewPhase events', () => {
        it('should start at phase 0', fakeAsync(() => {
          init_phase$_and_subscribe();
          expect(onNext).toHaveBeenCalledTimes(1);
          expect(onNext).toHaveBeenCalledWith(0);
          discardPeriodicTasks();
        }));

        describe('case: a NewPhase(1) event is emitted', () => {
          beforeEach(fakeAsync(() => {
            init_phase$_and_subscribe();
            triggerPhaseEvent(1);
            discardPeriodicTasks();
          }));

          it('should emit the phase "1"', () => {
            expect(onNext).toHaveBeenCalledTimes(2);
            expect(mostRecentPhase()).toEqual(1);
          });
        });

        describe('case: the registration deadline expires', () => {
          beforeEach(fakeAsync(() => {
            init_phase$_and_subscribe();
            jasmine.clock().tick(2 * msPerDay);
            tick();
            discardPeriodicTasks();
          }));

          it('should emit the phase "1"', fakeAsync(() => {
            expect(onNext).toHaveBeenCalledTimes(2);
            expect(mostRecentPhase()).toEqual(1);
          }));
        });

        describe('case: the voting deadline expires', () => {
          beforeEach(fakeAsync(() => {
            init_phase$_and_subscribe();
            jasmine.clock().tick(20 * msPerDay);
            tick();
            discardPeriodicTasks();
          }));

          it('should emit the phase "2"', fakeAsync(() => {
            expect(onNext).toHaveBeenCalledTimes(3);
            expect(mostRecentPhase()).toEqual(2);
          }));
        });
      });
    });

    xdescribe('case: all combinations of timings, phase events and non-phase events', () => {});
  });
});
