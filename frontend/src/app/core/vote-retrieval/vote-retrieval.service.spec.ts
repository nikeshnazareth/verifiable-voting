import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import 'rxjs/add/operator/distinctUntilChanged';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { Mock } from '../../mock/module';
import { CryptographyService } from '../cryptography/cryptography.service';
import { ErrorService } from '../error-service/error.service';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.constants';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IVoteParameters } from '../ipfs/formats.interface';
import { IPFSService } from '../ipfs/ipfs.service';
import Spy = jasmine.Spy;
import { VoteRetrievalErrors } from './vote-retreival-errors';
import {
  IDynamicValue,
  RetrievalStatus,
} from './vote-retreival.service.constants';
import { VoteRetrievalService } from './vote-retrieval.service';

describe('Service: VoteRetrievalService', () => {

  let voteListingSvc: VoteListingContractService;
  let anonymousVotingContractSvc: AnonymousVotingContractService;
  let cryptoSvc: CryptographyService;
  let ipfsSvc: IPFSService;
  let errSvc: ErrorService;
  const voteRetrievalSvc = () => new VoteRetrievalService(
    voteListingSvc, anonymousVotingContractSvc, cryptoSvc, ipfsSvc, errSvc
  );

  let onNext: Spy;
  let onError: (Error) => void;
  let onCompleted: Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ErrorService,
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: AnonymousVotingContractService, useClass: Mock.AnonymousVotingContractService},
        {provide: CryptographyService, useClass: Mock.CryptographyService},
        {provide: IPFSService, useClass: Mock.IPFSService},
      ]
    });
    voteListingSvc = TestBed.get(VoteListingContractService);
    anonymousVotingContractSvc = TestBed.get(AnonymousVotingContractService);
    cryptoSvc = TestBed.get(CryptographyService);
    ipfsSvc = TestBed.get(IPFSService);
    errSvc = TestBed.get(ErrorService);

    onNext = jasmine.createSpy('onNext');
    onError = (err) => fail(err);
    onCompleted = jasmine.createSpy('onCompleted');
    spyOn(errSvc, 'add').and.stub();
  });

  describe('property: summaries$', () => {

    const init_summaries$_and_subscribe = fakeAsync(() => {
      voteRetrievalSvc().summaries$
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
          individualNextHandler.push(jasmine.createSpy('onNext_' + idx));
          individualCompleteHandler.push(jasmine.createSpy('onComplete_' + idx));
          svc.summaries$
            .map(arr => arr[idx])
            .distinctUntilChanged()
            .subscribe(individualNextHandler[idx], onError, individualCompleteHandler[idx]);
        });
        tick();
      });

      describe('parameter: index', () => {

        describe('case: VoteListingService.deployedVotes$ has no null addresses', () => {
          it('should correspond to the index of the element in the observable', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map((handler, idx) => {
              expect(handler.calls.mostRecent().args[0].index).toEqual(idx);
            });
          });
        });

        describe('case: VoteListingService.deployedVotes$ has null addresses', () => {
          beforeEach(() => {
            const addresses = Mock.addresses.map(v => v); // make a shallow copy
            addresses[2] = null;
            spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            init_individual_summaries_and_subscribe();
          });

          it('should correspond to the index of the element in the observable', () => {
            individualNextHandler.map((handler, idx) => {
              expect(handler.calls.mostRecent().args[0].index).toEqual(idx);
            });
          });
        });
      });

      describe('parameter: address', () => {
        describe('case: VoteListingService.deployedVotes$ has null addresses', () => {
          const nullAddressIdx: number = 2;

          beforeEach(() => {
            const addresses = Mock.addresses.map(v => v); // make a shallow copy
            addresses[nullAddressIdx] = null;
            spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            init_individual_summaries_and_subscribe();
          });

          it(`should set the null address to ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[nullAddressIdx].calls.mostRecent().args[0].address)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect the other addresses', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== nullAddressIdx) {
                expect(handler.calls.mostRecent().args[0].address)
                  .toEqual({status: RetrievalStatus.available, value: Mock.addresses[idx]});
              }
            });
          });
        });
      });

      describe('parameter: phase', () => {
        describe('case: before phases are retrieved', () => {
          beforeEach(() => {
            spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
              const contractManager = new Mock.AnonymousVotingContractManager(addr);
              spyOnProperty(contractManager, 'phase$').and.returnValue(Observable.never());
              return contractManager;
            });
            init_individual_summaries_and_subscribe();
          });

          it(`should be initialised to ${RetrievalStatus.retrieving}`, () => {
            individualNextHandler.map(handler => {
              expect(handler.calls.mostRecent().args[0].phase)
                .toEqual({status: RetrievalStatus.retrieving, value: null});
            });
          });
        });

        describe('case: after phases are retrieved', () => {
          it('should emit the current phase', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map((handler, idx) => {
              expect(handler.calls.mostRecent().args[0].phase).toEqual({
                status: RetrievalStatus.available,
                value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
              });
            });
          });
        });

        describe('case: VoteListingService.deployedVotes$ has null addresses', () => {
          const nullAddressIdx: number = 2;

          beforeEach(() => {
            const addresses = Mock.addresses.map(v => v); // make a shallow copy
            addresses[nullAddressIdx] = null;
            spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            init_individual_summaries_and_subscribe();
          });

          it(`should set the phase to ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[nullAddressIdx].calls.mostRecent().args[0].phase)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect the other phases', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== nullAddressIdx) {
                expect(handler.calls.mostRecent().args[0].phase).toEqual({
                  status: RetrievalStatus.available,
                  value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
                });
              }
            });
          });
        });

        describe('case: One of the AnonymousVotingContractManagers phase$ values is an empty observable', () => {
          const emptyIndex: number = 1;

          beforeEach(() => {
            spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
              const contractManager = new Mock.AnonymousVotingContractManager(addr);
              if (addr === Mock.addresses[emptyIndex]) {
                spyOnProperty(contractManager, 'phase$').and.returnValue(Observable.empty());
              }
              return contractManager;
            });
            init_individual_summaries_and_subscribe();
          });

          it(`should emit ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[emptyIndex].calls.mostRecent().args[0].phase)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect other contract phase observables', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== emptyIndex) {
                expect(handler.calls.mostRecent().args[0].phase).toEqual({
                  status: RetrievalStatus.available,
                  value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
                });
              }
            });
          });
        });

        describe('case: the same address summary is requested multiple times', () => {
          let firstHandler: Spy;
          let secondHandler: Spy;
          let phases$: Observable<IDynamicValue<string>[]>;

          beforeEach(() => {
            const svc = voteRetrievalSvc();
            firstHandler = jasmine.createSpy('firstHandler');
            secondHandler = jasmine.createSpy('secondHandler');

            phases$ = svc.summaries$.map(arr => arr.map(summary => summary.phase));
          });

          describe('case: simultaneously', () => {
            beforeEach(fakeAsync(() => {
              phases$.subscribe(firstHandler);
              phases$.subscribe(secondHandler);
              tick();
            }));

            it('should produce the same final values on both observables', () => {
              expect(firstHandler.calls.mostRecent().args).toEqual(secondHandler.calls.mostRecent().args);
            });
          });

          describe('case: sequentially', () => {
            beforeEach(fakeAsync(() => {
              const sub: Subscription = phases$.subscribe(firstHandler);
              tick();
              sub.unsubscribe();
              tick();
              phases$.subscribe(secondHandler);
              tick();
            }));

            it('should produce the same final values on both observables', () => {
              expect(firstHandler.calls.mostRecent().args).toEqual(secondHandler.calls.mostRecent().args);
            });
          });
        });
      });

      describe('parameter: topic', () => {

        const topics: string[] = Mock.AnonymousVotingContractCollections.map(contract => contract.parameters.topic);
        const mockHashes: string[] = Mock.AnonymousVotingContractCollections.map(contract => contract.voteConstants.paramsHash);
        const mockParams: IVoteParameters[] = Mock.AnonymousVotingContractCollections
          .map(contract => contract.parameters);

        describe('case: before topic IPFS hashes are retrieved from the AnonymousVoting contracts', () => {

          beforeEach(() => {
            spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
              const contractManager = new Mock.AnonymousVotingContractManager(addr);
              spyOnProperty(contractManager, 'constants$').and.returnValue(Observable.never());
              return contractManager;
            });
            init_individual_summaries_and_subscribe();
          });


          it(`should be initialised to ${RetrievalStatus.retrieving}`, () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map(handler => {
              expect(handler.calls.mostRecent().args[0].topic)
                .toEqual({status: RetrievalStatus.retrieving, value: null});
            });
          });
        });

        describe('case: before parameters are retrieved from IPFS', () => {

          beforeEach(() => spyOn(ipfsSvc, 'catJSON').and.returnValue(Observable.never()));

          it(`should be initialised to ${RetrievalStatus.retrieving}`, () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map(handler => {
              expect(handler.calls.mostRecent().args[0].topic)
                .toEqual({status: RetrievalStatus.retrieving, value: null});
            });
          });
        });

        describe('case: after parameters are retrieved from IPFS', () => {
          it('should emit the topic', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map((handler, idx) => {
              expect(handler.calls.mostRecent().args[0].topic)
                .toEqual({status: RetrievalStatus.available, value: topics[idx]});
            });
          });
        });

        describe('case: VoteListingService.deployedVotes$ has null addresses', () => {
          const nullAddressIdx: number = 2;

          beforeEach(() => {
            const addresses = Mock.addresses.map(v => v); // make a shallow copy
            addresses[nullAddressIdx] = null;
            spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            init_individual_summaries_and_subscribe();
          });

          it(`should set the topic to ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[nullAddressIdx].calls.mostRecent().args[0].topic)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect the other topics', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== nullAddressIdx) {
                expect(handler.calls.mostRecent().args[0].topic)
                  .toEqual({status: RetrievalStatus.available, value: topics[idx]});
              }
            });
          });
        });

        describe('case: One of the AnonymousVotingContractManagers constants$ values is an empty observable', () => {
          const emptyIndex: number = 1;

          beforeEach(() => {
            spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
              const contractManager = new Mock.AnonymousVotingContractManager(addr);
              if (addr === Mock.addresses[emptyIndex]) {
                spyOnProperty(contractManager, 'constants$').and.returnValue(Observable.empty());
              }
              return contractManager;
            });
            init_individual_summaries_and_subscribe();
          });

          it(`should emit ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[emptyIndex].calls.mostRecent().args[0].topic)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect other contract topic values', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== emptyIndex) {
                expect(handler.calls.mostRecent().args[0].topic)
                  .toEqual({status: RetrievalStatus.available, value: topics[idx]});
              }
            });
          });
        });

        describe('case: IPFSService.catJSON fails for one address', () => {
          const failedIndex: number = 1;
          const error: Error = new Error('Unable to retrieve parameters');

          beforeEach(() => {
            spyOn(ipfsSvc, 'catJSON').and.callFake(hash => {
              const idx: number = mockHashes.findIndex(el => el === hash);
              return idx === failedIndex ? Observable.throwError(error) : Observable.of(mockParams[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should notify the Error Service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.ipfs.retrieval, error);
          });

          it(`should emit ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[failedIndex].calls.mostRecent().args[0].topic)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect other contract topic values', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== failedIndex) {
                expect(handler.calls.mostRecent().args[0].topic)
                  .toEqual({status: RetrievalStatus.available, value: topics[idx]});
              }
            });
          });
        });

        describe('case: one of the parameters is in the wrong format', () => {
          const invalid_params = {
            invalid: 'This is the wrong format'
          };
          const invalidIndex: number = 1;

          beforeEach(() => {
            spyOn(ipfsSvc, 'catJSON').and.callFake(hash => {
              const idx: number = mockHashes.findIndex(el => el === hash);
              return idx === invalidIndex ? Observable.of(invalid_params) : Observable.of(mockParams[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should notify the Error Service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(
              VoteRetrievalErrors.format.parameters(invalid_params), null
            );
          });

          it(`should emit ${RetrievalStatus.unavailable}`, () => {
            expect(individualNextHandler[invalidIndex].calls.mostRecent().args[0].topic)
              .toEqual({status: RetrievalStatus.unavailable, value: null});
          });

          it('should not affect other contract topic values', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== invalidIndex) {
                expect(handler.calls.mostRecent().args[0].topic)
                  .toEqual({status: RetrievalStatus.available, value: topics[idx]});
              }
            });
          });
        });

        describe('case: the same address summary is requested multiple times', () => {
          let firstHandler: Spy;
          let secondHandler: Spy;
          let topics$: Observable<IDynamicValue<string>[]>;

          beforeEach(() => {
            spyOn(ipfsSvc, 'catJSON').and.callThrough();
            const svc = voteRetrievalSvc();
            firstHandler = jasmine.createSpy('firstHandler');
            secondHandler = jasmine.createSpy('secondHandler');

            topics$ = svc.summaries$
              .map(arr => arr.map(summary => summary.topic));
          });

          describe('case: simultaneously', () => {
            beforeEach(fakeAsync(() => {
              topics$.subscribe(firstHandler);
              topics$.subscribe(secondHandler);
              tick();
            }));

            it('should produce the same final values on both observables', () => {
              expect(firstHandler.calls.mostRecent().args).toEqual(secondHandler.calls.mostRecent().args);
            });

            it('should only resolve the hash from IPFS once per address', () => {
              expect(ipfsSvc.catJSON).toHaveBeenCalledTimes(Mock.addresses.length);
            });
          });

          describe('case: sequentially', () => {
            beforeEach(fakeAsync(() => {
              const sub: Subscription = topics$.subscribe(firstHandler);
              tick();
              sub.unsubscribe();
              tick();
              topics$.subscribe(secondHandler);
              tick();
            }));

            it('should produce the same final values on both observables', () => {
              expect(firstHandler.calls.mostRecent().args).toEqual(secondHandler.calls.mostRecent().args);
            });

            it('should only resolve the hash from IPFS once per address', () => {
              expect(ipfsSvc.catJSON).toHaveBeenCalledTimes(Mock.addresses.length);
            });
          });

        });

      });
    });
  });

  describe('method: detailsAtIndex$', () => {
    let index: number;

    const init_detailsAtIndex$_and_subscribe = fakeAsync(() => {
      voteRetrievalSvc().detailsAtIndex$(index)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    describe('case: idx is out of range', () => {
      beforeEach(() => {
        index = Mock.addresses.length;
        init_detailsAtIndex$_and_subscribe();
      });

      it('should return a waiting observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).not.toHaveBeenCalled();
      });
    });

    describe('case: idx is in range', () => {
      xdescribe('it should repeat the "summary" tests', () => {
      });

      xdescribe('parameter: key', () => {
      });

      xdescribe('parameter: candidates', () => {
      });

      xdescribe('parameter: registrationAuthority', () => {
      });

      xdescribe('parameters: registration$$ and numPendingRegistrations', () => {
      });

      xdescribe('parameter: results', () => {
      });
    });
  });
});


