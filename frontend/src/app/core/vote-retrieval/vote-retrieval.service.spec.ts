import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/distinctUntilChanged';

import { RETRIEVAL_STATUS, VoteRetrievalService } from './vote-retrieval.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { Mock } from '../../mock/module';
import Spy = jasmine.Spy;

fdescribe('Service: ListVotesDataService', () => {

  let voteListingSvc: VoteListingContractService;
  let anonymousVotingSvc: AnonymousVotingContractService;
  let ipfsSvc: IPFSService;
  let errSvc: ErrorService;
  const voteRetrievalSvc = () => new VoteRetrievalService(voteListingSvc, anonymousVotingSvc, ipfsSvc, errSvc);

  let onNext: Spy;
  let onError: (Error) => void;
  let onCompleted: Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: AnonymousVotingContractService, useClass: Mock.AnonymousVotingContractService},
        {provide: IPFSService, useClass: Mock.IPFSService},
        {provide: ErrorService, useClass: Mock.ErrorService}
      ]
    });
    voteListingSvc = TestBed.get(VoteListingContractService);
    anonymousVotingSvc = TestBed.get(AnonymousVotingContractService);
    ipfsSvc = TestBed.get(IPFSService);
    errSvc = TestBed.get(ErrorService);

    onNext = jasmine.createSpy('onNext');
    onError = (err) => fail(err);
    onCompleted = jasmine.createSpy('onCompleted');
  });

  describe('property: summaries$', () => {

    let subscription: Subscription;

    const init_summaries$_and_subscribe = fakeAsync(() => {
      subscription = voteRetrievalSvc().summaries$
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should be an array with one element per address', () => {
      init_summaries$_and_subscribe();
      expect(onNext).toHaveBeenCalled();
      expect(onNext.calls.mostRecent().args[0].length).toEqual(Mock.addresses.length);
    });

    describe('each address', () => {
      let individualNextHandler: Spy[];
      let individualCompleteHandler: Spy[];

      const init_individual_summaries_and_subscribe = fakeAsync(() => {
        const svc = voteRetrievalSvc();
        individualNextHandler = [];
        individualCompleteHandler = [];
        Mock.addresses.map((addr, idx) => {
          individualNextHandler.push(jasmine.createSpy('onNext' + idx));
          individualCompleteHandler.push(jasmine.createSpy('onComplete_' + idx));
          svc.summaries$
            .map(arr => arr[idx])
            .distinctUntilChanged()
            .subscribe(individualNextHandler[idx], onError, individualCompleteHandler[idx]);
        });
      });

      describe('parameter: index', () => {

        describe('case: VoteListingService.deployedVotes$ has no null addresses', () => {
          it('should correspond to the index of the element in the observable', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map((handler, idx) => {
              expect(handler).toHaveBeenCalledTimes(1);
              expect(handler.calls.mostRecent().args[0].index).toEqual(idx);
            });
          });
        });

        describe('case: VoteListingService.deployedVotes$ has null addresses', () => {
          beforeEach(() => {
            const addresses = Mock.addresses.map(v => v); // make a shallow copy
            addresses[2] = null;
            spyOn(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            init_individual_summaries_and_subscribe();
          });

          it('should correspond to the index of the element in the observable', () => {
            individualNextHandler.map((handler, idx) => {
              expect(handler).toHaveBeenCalledTimes(1);
              expect(handler.calls.mostRecent().args[0].index).toEqual(idx);
            });
          });
        });
      });

      describe('parameters: phase', () => {
        it('should be initialised to "RETRIEVING..."', () => {
          init_individual_summaries_and_subscribe();
          individualNextHandler.map(handler => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler.calls.mostRecent().args[0].phase).toEqual(RETRIEVAL_STATUS.RETRIEVING);
          });
        });
      });
    });
  });


  describe('parameter: phase', () => {
    xit('should be initialised to "RETRIEVING..."');

    xit('should ')

    describe('case: AnonymousVotingService.newPhaseEventsAt$ returns an empty observable', () => {
      xit('should be "UNAVAILABLE"');
    });
  });

  describe('case: the same address summary is requested multiple times', () => {
    xit('TODO: values should be cached');
  })


  describe('case: VoteListingService.deployedVotes$ is empty', () => {
  });

  describe('case: there are null values in VoteListingService.deployedVotes$', () => {
  });
});
