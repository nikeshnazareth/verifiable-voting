import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subscription } from 'rxjs/Subscription';

import {
  AnonymousVotingContractErrors, AnonymousVotingContractService,
  IAnonymousVotingContractService
} from './contract.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { ErrorService } from '../../error-service/error.service';
import { APP_CONFIG } from '../../../config';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../../mock/module';
import { IContractLog } from '../contract.interface';
import { NewPhaseEvent, VotePhases } from './contract.api';
import { BigNumber } from '../../../mock/bignumber';
import Spy = jasmine.Spy;

describe('Service: AnonymousVotingContractService', () => {
  let anonymousVotingSvc: IAnonymousVotingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];
  const voter: IVoter = Mock.Voters[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnonymousVotingContractService,
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: TruffleContractWrapperService, useClass: Mock.TruffleAnonymousVotingWrapperService},
      ]
    });

    web3Svc = TestBed.get(Web3Service);
    contractSvc = TestBed.get(TruffleContractWrapperService);
    errSvc = TestBed.get(ErrorService);
  });

  const onError = (err) => fail(err);
  let onNext: Spy;
  let onCompleted: Spy;

  beforeEach(() => {
    onNext = jasmine.createSpy('onNext');
    onCompleted = jasmine.createSpy('onCompleted');
    spyOn(errSvc, 'add').and.stub();
  });

  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3, null);
    }));
  });

  describe('method: phaseAt$', () => {
    const newLog = (phase) => ({
      event: NewPhaseEvent.name,
      args: {
        phase: new BigNumber(phase)
      }
    });

    let phaseSubscription: Subscription;

    const init_phaseAt$_and_subscribe = fakeAsync(() => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      phaseSubscription = anonymousVotingSvc.phaseAt$(voteCollection.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    describe('contract is at phase 0', () => {
      beforeEach(() => spyOn(voteCollection.instance.currentPhase, 'call').and
        .returnValue(Promise.resolve(new BigNumber(0)))
      );

      it('should emit 0 and wait', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(0);
        expect(onCompleted).not.toHaveBeenCalled();
      });
    });

    describe('contract is at phase 1', () => {

      beforeEach(() => spyOn(voteCollection.instance.currentPhase, 'call').and
        .returnValue(Promise.resolve(new BigNumber(1)))
      );

      it('should emit 1 and wait', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(1);
        expect(onCompleted).not.toHaveBeenCalled();
      });
    });

    describe('contract is at the final phase', () => {
      beforeEach(() =>
        spyOn(voteCollection.instance.currentPhase, 'call').and
          .returnValue(Promise.resolve(new BigNumber(VotePhases.length - 1)))
      );

      it('should emit the final phase and complete', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(VotePhases.length - 1);
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    it('should emit a new event whenever the AnonymousVoting contract emits a NewPhase event', () => {
      spyOn(voteCollection.instance.currentPhase, 'call').and
        .returnValue(Promise.resolve(new BigNumber(0)));
      init_phaseAt$_and_subscribe();

      expect(onNext).toHaveBeenCalledTimes(1);

      voteCollection.eventStream.trigger(null, newLog(1));
      expect(onNext).toHaveBeenCalledTimes(2);

      voteCollection.eventStream.trigger(null, newLog(2));
      expect(onNext).toHaveBeenCalledTimes(3);
    });

    it('should emit the phase as the event', () => {
      spyOn(voteCollection.instance.currentPhase, 'call').and
        .returnValue(Promise.resolve(new BigNumber(0)));
      init_phaseAt$_and_subscribe();

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(0);

      voteCollection.eventStream.trigger(null, newLog(1));
      expect(onNext).toHaveBeenCalledTimes(2);
      expect(onNext.calls.mostRecent().args[0]).toEqual(1);

      voteCollection.eventStream.trigger(null, newLog(2));
      expect(onNext).toHaveBeenCalledTimes(3);
      expect(onNext.calls.mostRecent().args[0]).toEqual(2);
    });

    it('should ignore non-NewPhase events', () => {
      const otherEvent: IContractLog = {
        event: 'Another event',
        args: {
          param1: 'param1',
          param2: 1
        }
      };
      init_phaseAt$_and_subscribe();
      expect(onNext).toHaveBeenCalledTimes(1);
      voteCollection.eventStream.trigger(null, otherEvent);
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('should complete after all the phases are emitted', () => {
      init_phaseAt$_and_subscribe();
      for (let phase = 1; phase < VotePhases.length; phase++) {
        voteCollection.eventStream.trigger(null, newLog(phase));
      }
      expect(onCompleted).toHaveBeenCalled();
    });

    it('should complete when the last phase is emitted', () => {
      const currentPhase: number = 1;
      spyOn(voteCollection.instance.currentPhase, 'call').and
        .returnValue(Promise.resolve(new BigNumber(currentPhase)));

      init_phaseAt$_and_subscribe();
      for (let phase = currentPhase + 1; phase < VotePhases.length; phase++) {
        voteCollection.eventStream.trigger(null, newLog(phase));
      }
      expect(onCompleted).toHaveBeenCalled();
    });

    it('should remove the event listener when the observer completes', () => {
      spyOn(voteCollection.eventStream, 'stopWatching').and.stub();
      init_phaseAt$_and_subscribe();
      for (let phase = 1; phase < VotePhases.length; phase++) {
        voteCollection.eventStream.trigger(null, newLog(phase));
      }
      expect(voteCollection.eventStream.stopWatching).toHaveBeenCalled();
    });

    it('should remove the event listener when the observer unsubscribes', () => {
      spyOn(voteCollection.eventStream, 'stopWatching').and.stub();
      init_phaseAt$_and_subscribe();
      expect(voteCollection.eventStream.stopWatching).not.toHaveBeenCalled();
      phaseSubscription.unsubscribe();
      expect(voteCollection.eventStream.stopWatching).toHaveBeenCalled();
    });

    describe('case: the event stream contains an error', () => {
      const streamError: Error = new Error('Error in event stream');

      it('should notify the Error Service if the contract event stream contains an error', () => {
        init_phaseAt$_and_subscribe();
        voteCollection.eventStream.trigger(streamError, null);
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.events(voteCollection.address), streamError
        );
      });

      it('should not affect the phaseAt$ stream', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(1);
        voteCollection.eventStream.trigger(streamError, null);
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onCompleted).not.toHaveBeenCalled();
      });

      it('should handle interleaved NewPhase and error events', () => {
        let nEvents: number = 0;
        let nErrors: number = 0;
        const lastPhase = () => nEvents; // the phases map directly to the count

        const checkExpectations = () => {
          expect(onNext.calls.mostRecent().args[0]).toEqual(lastPhase());
          expect(onNext).toHaveBeenCalledTimes(nEvents + 1); // there is an emission before the first NewPhase event
          expect(errSvc.add).toHaveBeenCalledTimes(nErrors);
        };

        const logEvent = () => {
          voteCollection.eventStream.trigger(null, newLog(lastPhase() + 1));
          nEvents++;
        };

        const errEvent = () => {
          voteCollection.eventStream.trigger(streamError, null);
          nErrors++;
        };

        init_phaseAt$_and_subscribe();
        logEvent();
        checkExpectations();
        errEvent();
        checkExpectations();
        errEvent();
        checkExpectations();
        logEvent();
        checkExpectations();
      });
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: there is no AnonymousVoting contract at the specified address', () => {
      const error: Error = new Error('No contract at the specified address');

      beforeEach(() => spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_phaseAt$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(voteCollection.address), error);
      });

      it('should return an empty observable', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.currentPhase.call() fails', () => {
      const error: Error = new Error('Unable to retrieve the current phase');

      beforeEach(() => spyOn(voteCollection.instance.currentPhase, 'call').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_phaseAt$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.phase(voteCollection.address), error
        );
      });

      it('should return an empty observable', () => {
        init_phaseAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

  });

  describe('method: paramsHashAt$', () => {

    const init_paramsHashAt$_and_subscribe = fakeAsync(() => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      anonymousVotingSvc.paramsHashAt$(voteCollection.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should return an observable that emits the parameters hash and completed', () => {
      init_paramsHashAt$_and_subscribe();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(voteCollection.params_hash);
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', () => {
        init_paramsHashAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: AnonymousVoting contract is not deployed at the address', () => {

      const error: Error = new Error('No contract at the specified address');

      beforeEach(() => spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_paramsHashAt$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(voteCollection.address), error);
      });

      it('should return an empty observable', () => {
        init_paramsHashAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.parametersHash.call() fails', () => {
      const error: Error = new Error('Unable to retrieve parameters hash');

      beforeEach(() => spyOn(voteCollection.instance.parametersHash, 'call').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_paramsHashAt$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.paramsHash(voteCollection.address), error
        );
      });

      it('should return an empty observable', () => {
        init_paramsHashAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('method: registrationDeadlineAt$', () => {

    const init_regDeadlineAt$_and_subscribe = fakeAsync(() => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      anonymousVotingSvc.registrationDeadlineAt$(voteCollection.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should return an observable that emits the deadline and completes', () => {
      init_regDeadlineAt$_and_subscribe();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(new Date(voteCollection.timeframes.registrationDeadline));
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', () => {
        init_regDeadlineAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: AnonymousVoting contract is not deployed at the address', () => {

      const error: Error = new Error('No contract at the specified address');

      beforeEach(() => spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_regDeadlineAt$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(voteCollection.address), error);
      });

      it('should return an empty observable', () => {
        init_regDeadlineAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.registrationDeadline.call() fails', () => {
      const error: Error = new Error('Unable to retrieve registration deadline');

      beforeEach(() => spyOn(voteCollection.instance.registrationDeadline, 'call').and
        .returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_regDeadlineAt$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.regDeadline(voteCollection.address), error
        );
      });

      it('should return an empty observable', () => {
        init_regDeadlineAt$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('method: votingDeadlineAt$', () => {

    const init_votingDeadlineAt$ = fakeAsync(() => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      anonymousVotingSvc.votingDeadlineAt$(voteCollection.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should return an observable that emits the deadline and completes', () => {
      init_votingDeadlineAt$();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(new Date(voteCollection.timeframes.votingDeadline));
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', () => {
        init_votingDeadlineAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: AnonymousVoting contract is not deployed at the address', () => {

      const error: Error = new Error('No contract at the specified address');

      beforeEach(() => spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_votingDeadlineAt$();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(voteCollection.address), error);
      });

      it('should return an empty observable', () => {
        init_votingDeadlineAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.votingDeadline.call() fails', () => {
      const error: Error = new Error('Unable to retrieve voting deadline');

      beforeEach(() => spyOn(voteCollection.instance.votingDeadline, 'call').and
        .returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_votingDeadlineAt$();
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.votingDeadline(voteCollection.address), error
        );
      });

      it('should return an empty observable', () => {
        init_votingDeadlineAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('method: registerAt$', () => {

    const init_registerAt$ = fakeAsync(() => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      anonymousVotingSvc.registerAt$(voteCollection.address, voter.public_address, voter.blinded_address_hash)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should call the "register" function on the AnonymousVoting contract', () => {
      spyOn(voteCollection.instance, 'register').and.callThrough();
      init_registerAt$();
      expect(voteCollection.instance.register).toHaveBeenCalled();
    });

    it('should pass the blinded address hash to the AnonymousVoting.register function', () => {
      spyOn(voteCollection.instance, 'register').and.callThrough();
      init_registerAt$();
      expect((<Spy>voteCollection.instance.register).calls.mostRecent().args[0]).toEqual(voter.blinded_address_hash);
    });

    it('should set the message sender on the AnonymousVoting.register call to the specified voter address', () => {
      spyOn(voteCollection.instance, 'register').and.callThrough();
      init_registerAt$();
      expect((<Spy>voteCollection.instance.register).calls.mostRecent().args[1]).toEqual({from: voter.public_address});
    });

    it('should return the contract register receipt', () => {
      init_registerAt$();
      expect(onNext).toHaveBeenCalledWith(voter.register_receipt);
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', () => {
        init_registerAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: there is no AnonymousVoting contract at the specified address', () => {
      const error: Error = new Error('No contract at the specified address');

      beforeEach(() => spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_registerAt$();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(voteCollection.address), error);
      });

      it('should return an empty observable', () => {
        init_registerAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.register fails', () => {
      const error: Error = new Error('Unable to register voter');

      beforeEach(() => spyOn(voteCollection.instance, 'register').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_registerAt$();
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.registration(voteCollection.address, voter.public_address), error
        );
      });

      it('should return an empty observable', () => {
        init_registerAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});



