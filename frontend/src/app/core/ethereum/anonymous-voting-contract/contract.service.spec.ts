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
import { IAnonymousVotingContractCollection, Mock } from '../../../mock/module';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnonymousVotingContractService,
        {provide: ErrorService, useClass: Mock.ErrorService},
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
  });

  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3, null);
    }));
  });

  describe('method: newPhaseEventsAt$', () => {
    const newLog = (phase) => ({
      event: NewPhaseEvent.name,
      args: {
        phase: new BigNumber(phase)
      }
    });

    let newPhaseSubscription: Subscription;

    const init_newPhaseEvent$_and_subscribe = () => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      newPhaseSubscription = anonymousVotingSvc.newPhaseEventsAt$(voteCollection.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should return a waiting observable', fakeAsync(() => {
      init_newPhaseEvent$_and_subscribe();
      expect(onNext).not.toHaveBeenCalled();
      expect(onCompleted).not.toHaveBeenCalled();
    }));

    it('should emit a new event whenever the AnonymousVoting contract emits a NewPhase event', fakeAsync(() => {
      init_newPhaseEvent$_and_subscribe();
      voteCollection.eventStream.trigger(null, newLog(1));
      expect(onNext).toHaveBeenCalledTimes(1);

      voteCollection.eventStream.trigger(null, newLog(2));
      expect(onNext).toHaveBeenCalledTimes(2);
    }));

    it('should emit the phase as the event', fakeAsync(() => {
      init_newPhaseEvent$_and_subscribe();
      voteCollection.eventStream.trigger(null, newLog(1));
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext.calls.mostRecent().args[0]).toEqual(1);

      voteCollection.eventStream.trigger(null, newLog(2));
      expect(onNext).toHaveBeenCalledTimes(2);
      expect(onNext.calls.mostRecent().args[0]).toEqual(2);
    }));

    it('should ignore non-NewPhase events', fakeAsync(() => {
      const otherEvent: IContractLog = {
        event: 'Another event',
        args: {
          param1: 'param1',
          param2: 1
        }
      };
      init_newPhaseEvent$_and_subscribe();
      voteCollection.eventStream.trigger(null, otherEvent);
      expect(onNext).not.toHaveBeenCalled();
      expect(onCompleted).not.toHaveBeenCalled();
    }));

    it('should complete after all the phases are emitted', fakeAsync(() => {
      init_newPhaseEvent$_and_subscribe();
      for (let phase = 1; phase < VotePhases.length; phase++) {
        voteCollection.eventStream.trigger(null, newLog(phase));
      }
      expect(onCompleted).toHaveBeenCalled();
    }));

    it('should remove the event listener when the observer completes', fakeAsync(() => {
      spyOn(voteCollection.eventStream, 'stopWatching').and.stub();
      init_newPhaseEvent$_and_subscribe();
      for (let phase = 1; phase < VotePhases.length; phase++) {
        voteCollection.eventStream.trigger(null, newLog(phase));
      }
      expect(voteCollection.eventStream.stopWatching).toHaveBeenCalled();
    }));

    it('should remove the event listener when the observer unsubscribes', fakeAsync(() => {
      spyOn(voteCollection.eventStream, 'stopWatching').and.stub();
      init_newPhaseEvent$_and_subscribe();
      expect(voteCollection.eventStream.stopWatching).not.toHaveBeenCalled();
      newPhaseSubscription.unsubscribe();
      expect(voteCollection.eventStream.stopWatching).toHaveBeenCalled();
    }));


    describe('case: the event stream contains an error', () => {
      const streamError: Error = new Error('Error in event stream');

      it('should notify the Error Service if the contract event stream contains an error', fakeAsync(() => {
        init_newPhaseEvent$_and_subscribe();
        voteCollection.eventStream.trigger(streamError, null);
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.events(voteCollection.address), streamError
        );
      }));

      it('should not affect the newPhaseEventsAt$ stream', fakeAsync(() => {
        init_newPhaseEvent$_and_subscribe();
        voteCollection.eventStream.trigger(streamError, null);
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).not.toHaveBeenCalled();
      }));

      it('should handle interleaved NewPhase and error events', fakeAsync(() => {
        let nEvents: number = 0;
        let nErrors: number = 0;
        const lastPhase = () => nEvents; // the phases map directly to the count

        const checkExpectations = () => {
          expect(onNext.calls.mostRecent().args[0]).toEqual(lastPhase());
          expect(onNext).toHaveBeenCalledTimes(nEvents);
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

        init_newPhaseEvent$_and_subscribe();
        logEvent();
        checkExpectations();
        errEvent();
        checkExpectations();
        errEvent();
        checkExpectations();
        logEvent();
        checkExpectations();
      }));
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', fakeAsync(() => {
        init_newPhaseEvent$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: there is no AnonymousVoting contract at the specified address', () => {
      const error: Error = new Error('No contract at the specified address');

      beforeEach(() => spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', fakeAsync(() => {
        init_newPhaseEvent$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(voteCollection.address), error);
      }));

      it('should return an empty observable', fakeAsync(() => {
        init_newPhaseEvent$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
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

  xdescribe('TODO: remove method: contractAt', () => {
    const VoteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];

    const init_svc_and_contractAt_handlers = () => {
      anonymousVotingSvc = new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);
      anonymousVotingSvc.contractAt(VoteCollection.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should return an observable that emits the contract and completes', fakeAsync(() => {
      init_svc_and_contractAt_handlers();
      expect(onNext).toHaveBeenCalledWith(VoteCollection.instance);
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalledTimes(1);
    }));

    describe('case: web3 is not injected', () => {
      it('should return an empty observable', fakeAsync(() => {
        spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
        init_svc_and_contractAt_handlers();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalledTimes(1);
      }));
    });

    describe('case: AnonymousVoting contract is not deployed at the address', () => {
      it('should notify the Error Service that contractAt fails', fakeAsync(() => {
        const contractUnavailable: Error = new Error('Cannot find contract at address');
        spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(contractUnavailable));
        init_svc_and_contractAt_handlers();
        expect(errSvc.add).toHaveBeenCalledWith(
          AnonymousVotingContractErrors.network(VoteCollection.address),
          contractUnavailable
        );
      }));

      it('should return an empty observable', fakeAsync(() => {
        const contractUnavailable: Error = new Error('Cannot find contract at address');
        spyOn(Mock.TruffleAnonymousVotingAbstraction, 'at').and.returnValue(Promise.reject(contractUnavailable));
        init_svc_and_contractAt_handlers();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalledTimes(1);
      }));
    });
  });
});



