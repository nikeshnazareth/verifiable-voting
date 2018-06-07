import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/distinctUntilChanged';

import { VoteRetrievalService } from './vote-retrieval.service';
import {
  IVotingContractDetails, RETRIEVAL_STATUS,
  VoteRetrievalServiceErrors
} from './vote-retreival.service.constants';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.api';
import { IVoteParameters } from '../vote-manager/vote-manager.service';
import { address } from '../ethereum/type.mappings';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../mock/module';
import Spy = jasmine.Spy;

describe('Service: VoteRetrievalService', () => {

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
        ErrorService,
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: AnonymousVotingContractService, useClass: Mock.AnonymousVotingContractService},
        {provide: IPFSService, useClass: Mock.IPFSService},
      ]
    });
    voteListingSvc = TestBed.get(VoteListingContractService);
    anonymousVotingSvc = TestBed.get(AnonymousVotingContractService);
    ipfsSvc = TestBed.get(IPFSService);
    errSvc = TestBed.get(ErrorService);

    onNext = jasmine.createSpy('onNext');
    onError = (err) => fail(err);
    onCompleted = jasmine.createSpy('onCompleted');
    spyOn(errSvc, 'add').and.stub();
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

          it('should set the null address to "UNAVAILABLE"', () => {
            expect(individualNextHandler[nullAddressIdx].calls.mostRecent().args[0].address)
              .toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('should not affect the other addresses', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== nullAddressIdx) {
                expect(handler.calls.mostRecent().args[0].address).toEqual(Mock.addresses[idx]);
              }
            });
          });
        });
      });

      describe('parameter: phase', () => {
        const mockPhases = [0, 2, 1, 1];

        describe('case: before phases are retrieved', () => {
          it('should be initialised to "RETRIEVING..."', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map(handler => {
              expect(handler.calls.mostRecent().args[0].phase).toEqual(RETRIEVAL_STATUS.RETRIEVING);
            });
          });
        });

        describe('case: after phases are retrieved', () => {
          beforeEach(() => {
            spyOn(anonymousVotingSvc, 'phaseAt$').and.callFake(addr => {
              const idx: number = Mock.addresses.findIndex(el => el === addr);
              return Observable.of(mockPhases[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should emit the current phase', () => {
            individualNextHandler.map((handler, idx) => {
              expect(handler.calls.mostRecent().args[0].phase).toEqual(VotePhases[mockPhases[idx]]);
            });
          });
        });

        describe('case: VoteListingService.deployedVotes$ has null addresses', () => {
          const nullAddressIdx: number = 2;

          beforeEach(() => {
            const addresses = Mock.addresses.map(v => v); // make a shallow copy
            addresses[nullAddressIdx] = null;
            spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            spyOn(anonymousVotingSvc, 'phaseAt$').and.callFake(addr => {
              const idx: number = Mock.addresses.findIndex(el => el === addr);
              return Observable.of(mockPhases[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should set the phase to "UNAVAILABLE"', () => {
            expect(individualNextHandler[nullAddressIdx].calls.mostRecent().args[0].phase)
              .toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('should not affect the other phases', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== nullAddressIdx) {
                expect(handler.calls.mostRecent().args[0].phase).toEqual(VotePhases[mockPhases[idx]]);
              }
            });
          });
        });

        describe('case: AnonymousVotingService.phaseAt$ returns an empty observable for one address', () => {
          const emptyIndex: number = 1;

          beforeEach(() => {
            spyOn(anonymousVotingSvc, 'phaseAt$').and.callFake(addr => {
              const idx: number = Mock.addresses.findIndex(el => el === addr);
              return idx === emptyIndex ? Observable.empty() : Observable.of(mockPhases[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should emit "UNAVAILABLE"', () => {
            expect(individualNextHandler[emptyIndex].calls.mostRecent().args[0].phase).toEqual('UNAVAILABLE');
          });

          it('should not affect other contract phase observables', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== emptyIndex) {
                expect(handler.calls.mostRecent().args[0].phase).toEqual(VotePhases[mockPhases[idx]]);
              }
            });
          });
        });

        describe('case: the same address summary is requested multiple times', () => {
          let firstHandler: Spy;
          let secondHandler: Spy;
          let phases$: Observable<string[]>;

          beforeEach(() => {
            spyOn(anonymousVotingSvc, 'phaseAt$').and.callFake(addr => {
              const idx: number = Mock.addresses.findIndex(el => el === addr);
              return Observable.of(mockPhases[idx]);
            });
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

            it('should produce the same values on both observables', () => {
              expect(firstHandler.calls.allArgs()).toEqual(secondHandler.calls.allArgs());
            });

            it('should only request the values from the AnonymousVotingService once per address', () => {
              expect(anonymousVotingSvc.phaseAt$).toHaveBeenCalledTimes(Mock.addresses.length);
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

            it('should only request the values from the AnonymousVotingService once per address', () => {
              expect(anonymousVotingSvc.phaseAt$).toHaveBeenCalledTimes(Mock.addresses.length);
            });
          });
        });
      });

      describe('parameter: topic', () => {

        const topics: string[] = Mock.AnonymousVotingContractCollections.map(contract => contract.parameters.topic);
        const mockHashes: string[] = Mock.AnonymousVotingContractCollections.map(contract => contract.params_hash);
        const mockParams: IVoteParameters[] = Mock.AnonymousVotingContractCollections
          .map(contract => contract.parameters);

        describe('case: before topic IPFS hashes are retrieved from the AnonymousVoting contracts', () => {

          beforeEach(() => spyOn(anonymousVotingSvc, 'paramsHashAt$').and.returnValue(Observable.never()));

          it('should be initialised to "RETRIEVING..."', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map(handler => {
              expect(handler.calls.mostRecent().args[0].topic).toEqual(RETRIEVAL_STATUS.RETRIEVING);
            });
          });
        });

        describe('case: before parameters are retrieved from IPFS', () => {

          const unresolvedPromise: Promise<IVoteParameters> = new Promise(resolve => null);

          beforeEach(() => spyOn(ipfsSvc, 'catJSON').and.returnValue(unresolvedPromise));

          it('should be initialised to "RETRIEVING..."', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map(handler => {
              expect(handler.calls.mostRecent().args[0].topic).toEqual(RETRIEVAL_STATUS.RETRIEVING);
            });
          });
        });

        describe('case: after parameters are retrieved from IPFS', () => {
          it('should emit the topic', () => {
            init_individual_summaries_and_subscribe();
            individualNextHandler.map((handler, idx) => {
              expect(handler.calls.mostRecent().args[0].topic).toEqual(topics[idx]);
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

          xit('should set the topic to "UNAVAILABLE"', () => {
            expect(individualNextHandler[nullAddressIdx].calls.mostRecent().args[0].topic)
              .toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('should not affect the other topics', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== nullAddressIdx) {
                expect(handler.calls.mostRecent().args[0].topic).toEqual(topics[idx]);
              }
            });
          });
        });


        describe('case: AnonymousVotingService.paramsHashAt$ returns an empty observable for one address', () => {
          const emptyIndex: number = 1;

          beforeEach(() => {
            spyOn(anonymousVotingSvc, 'paramsHashAt$').and.callFake(addr => {
              const idx: number = Mock.addresses.findIndex(el => el === addr);
              return idx === emptyIndex ? Observable.empty() : Observable.of(mockHashes[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should emit UNAVAILABLE', () => {
            expect(individualNextHandler[emptyIndex].calls.mostRecent().args[0].topic).toEqual('UNAVAILABLE');
          });

          it('should not affect other contract topic values', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== emptyIndex) {
                expect(handler.calls.mostRecent().args[0].topic).toEqual(topics[idx]);
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
              return idx === failedIndex ? Promise.reject(error) : Promise.resolve(mockParams[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should notify the Error Service', () => {
            const addr: address = Mock.addresses[failedIndex];
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalServiceErrors.ipfs.getParameters(addr), error);
          });

          it('should emit UNAVAILABLE', () => {
            expect(individualNextHandler[failedIndex].calls.mostRecent().args[0].topic).toEqual('UNAVAILABLE');
          });

          it('should not affect other contract topic values', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== failedIndex) {
                expect(handler.calls.mostRecent().args[0].topic).toEqual(topics[idx]);
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
              return idx === invalidIndex ? Promise.resolve(invalid_params) : Promise.resolve(mockParams[idx]);
            });
            init_individual_summaries_and_subscribe();
          });

          it('should notify the Error Service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(
              VoteRetrievalServiceErrors.format.parameters(invalid_params), null
            );
          });

          it('should emit UNAVAILABLE', () => {
            expect(individualNextHandler[invalidIndex].calls.mostRecent().args[0].topic).toEqual('UNAVAILABLE');
          });

          it('should not affect other contract topic values', () => {
            individualNextHandler.map((handler, idx) => {
              if (idx !== invalidIndex) {
                expect(handler.calls.mostRecent().args[0].topic).toEqual(topics[idx]);
              }
            });
          });
        });

        describe('case: the same address summary is requested multiple times', () => {
          let firstHandler: Spy;
          let secondHandler: Spy;
          let topics$: Observable<string[]>;

          beforeEach(() => {
            spyOn(anonymousVotingSvc, 'paramsHashAt$').and.callThrough();
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

            it('should produce the same values on both observables', () => {
              expect(firstHandler.calls.allArgs()).toEqual(secondHandler.calls.allArgs());
            });

            it('should only request the hash from the AnonymousVotingService once per address', () => {
              expect(anonymousVotingSvc.paramsHashAt$).toHaveBeenCalledTimes(Mock.addresses.length);
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

            it('should only request the hash from the AnonymousVotingService once per address', () => {
              expect(anonymousVotingSvc.paramsHashAt$).toHaveBeenCalledTimes(Mock.addresses.length);
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
    const index: number = 2;
    const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[index];
    const init_detailsAtIndex$_and_subscribe = fakeAsync(() => {
      voteRetrievalSvc().detailsAtIndex$(index)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });
    const lastEmitted: (() => IVotingContractDetails) = () => onNext.calls.mostRecent().args[0];

    xit('NOTE: many of the cases have been tested in the summaries$ property. The following are the additions');

    describe('parameter: index', () => {
      it('the index should match the specified index', () => {
        init_detailsAtIndex$_and_subscribe();
        expect(lastEmitted().index).toEqual(index);

        describe('case: the specified index corresponds to a null value in VoteListingService.deployedVotes$', () => {
          beforeEach(() => {
            const addresses: address[] = Mock.addresses.map(v => v); // make a shallow copy
            addresses[index] = null;
            spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.from(addresses));
            init_detailsAtIndex$_and_subscribe();
          });

          it('the topic should be "UNAVAILABLE"', () => {
            expect(lastEmitted().parameters.topic).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('the candidates should be an empty list', () => {
            expect(lastEmitted().parameters.candidates).toEqual([]);
          });

          it('the registration key modulus should be "UNAVAILABLE', () => {
            expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('the registration key public exponent should be "UNAVAILABLE', () => {
            expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });
        });

        describe('case: the specified index is negative', () => {

          const newIndex: number = -1;

          beforeEach(fakeAsync(() => {
            voteRetrievalSvc().detailsAtIndex$(newIndex)
              .subscribe(onNext, onError, onCompleted);
            tick();
          }));

          it('the topic should be "UNAVAILABLE"', () => {
            expect(lastEmitted().parameters.topic).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('the candidates should be an empty list', () => {
            expect(lastEmitted().parameters.candidates).toEqual([]);
          });

          it('the registration key modulus should be "UNAVAILABLE', () => {
            expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('the registration key public exponent should be "UNAVAILABLE', () => {
            expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });
        });

        describe('case: the specified index exceeds the highest index in VoteListingService.deployedVotes$', () => {
          const newIndex: number = Mock.addresses.length;

          beforeEach(fakeAsync(() => {
            voteRetrievalSvc().detailsAtIndex$(newIndex)
              .subscribe(onNext, onError, onCompleted);
            tick();
          }));

          it('the topic should be "UNAVAILABLE"', () => {
            expect(lastEmitted().parameters.topic).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('the candidates should be an empty list', () => {
            expect(lastEmitted().parameters.candidates).toEqual([]);
          });

          it('the registration key modulus should be "UNAVAILABLE', () => {
            expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });

          it('the registration key public exponent should be "UNAVAILABLE', () => {
            expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
          });
        });
      });
    });

    describe('parameter: address', () => {
      it('the address should match the address of the corresponding contract', () => {
        init_detailsAtIndex$_and_subscribe();
        expect(lastEmitted().address).toEqual(voteCollection.address);
      });
    });

    describe('parameter: parameters', () => {
      describe('case: before the parameters hash is retrieved from the AnonymousVoting contract', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'paramsHashAt$').and.returnValue(Observable.never());
          init_detailsAtIndex$_and_subscribe();
        });

        it('the candidates should be an empty list', () => {
          expect(lastEmitted().parameters.candidates).toEqual([]);
        });

        it('the registration key modulus should be "RETRIEVING..."', () => {
          expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('the registration key public exponent should be "RETRIEVING..."', () => {
          expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });
      });

      describe('case: before the parameters are retrieved from IPFS', () => {
        const unresolvedPromise: Promise<IVoteParameters> = new Promise(resolve => null);

        beforeEach(() => {
          spyOn(ipfsSvc, 'catJSON').and.returnValue(unresolvedPromise);
          init_detailsAtIndex$_and_subscribe();
        });

        it('the candidates should be an empty list', () => {
          expect(lastEmitted().parameters.candidates).toEqual([]);
        });

        it('the registration key modulus should be "RETRIEVING..."', () => {
          expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('the registration key public exponent should be "RETRIEVING..."', () => {
          expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });
      });

      describe('case: after the parameters are retrieved from IPFS', () => {
        beforeEach(() => {
          init_detailsAtIndex$_and_subscribe();
        });

        it('the candidates should match the candidates at the corresponding contract', () => {
          expect(lastEmitted().parameters.candidates).toEqual(voteCollection.parameters.candidates);
        });

        it('the registration key should match the registration key of the corresponding contract', () => {
          expect(lastEmitted().parameters.registration_key).toEqual(voteCollection.parameters.registration_key);
        });
      });

      describe('case: AnonymousVotingService.paramsHashAt$ return an empty observable', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'paramsHashAt$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('the candidates should be an empty list', () => {
          expect(lastEmitted().parameters.candidates).toEqual([]);
        });

        it('the registration key modulus should be "UNVAILABLE"', () => {
          expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('the registration key public exponent should be "UNVAILABLE"', () => {
          expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });
      });

      describe('case: IPFSService.catJSON fails', () => {
        const error: Error = new Error('could not retrieve the parameters from the hash');

        beforeEach(() => {
          spyOn(ipfsSvc, 'catJSON').and.returnValue(Promise.reject(error));
          init_detailsAtIndex$_and_subscribe();
        });

        it('the candidates should be an empty list', () => {
          expect(lastEmitted().parameters.candidates).toEqual([]);
        });

        it('the registration key modulus should be "UNAVAILABLE"', () => {
          expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('the registration key public exponent should be "UNAVAILABLE"', () => {
          expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });
      });

      describe('case: the returns parameters have the wrong format', () => {
        const invalid = {
          invalid: 'This is not a valid IVoteParameters object'
        };

        beforeEach(() => {
          spyOn(ipfsSvc, 'catJSON').and.returnValue(Promise.resolve(invalid));
          init_detailsAtIndex$_and_subscribe();
        });

        it('the candidates should be an empty list', () => {
          expect(lastEmitted().parameters.candidates).toEqual([]);
        });

        it('the registration key modulus should be "UNAVAILABLE"', () => {
          expect(lastEmitted().parameters.registration_key.modulus).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('the registration key public exponent should be "UNAVAILABLE"', () => {
          expect(lastEmitted().parameters.registration_key.public_exp).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });
      });
    });

    describe('parameter: registrationDeadline', () => {
      describe('case: the contract cannot be retrieved from the index', () => {
        beforeEach(() => {
          spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "UNAVAILABLE"', () => {
          expect(lastEmitted().registrationDeadline.status).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().registrationDeadline.value).toEqual(null);
        });
      });

      describe('case: before the registration deadline is retrieved', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'registrationDeadlineAt$').and.returnValue(Observable.never());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "RETRIEVING...', () => {
          expect(lastEmitted().registrationDeadline.status).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().registrationDeadline.value).toEqual(null);
        });
      });

      describe('case: after the registration deadline is retrieved', () => {
        beforeEach(() => init_detailsAtIndex$_and_subscribe());

        it('"status" should be "AVAILABLE', () => {
          expect(lastEmitted().registrationDeadline.status).toEqual(RETRIEVAL_STATUS.AVAILABLE);
        });

        it('"value" should be set', () => {
          const deadline = new Date(Mock.AnonymousVotingContractCollections[index].timeframes.registrationDeadline);
          expect(lastEmitted().registrationDeadline.value).toEqual(deadline);
        });
      });

      describe('case: registrationDeadlineAt$ returns an empty observable', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'registrationDeadlineAt$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "UNAVAILABLE', () => {
          expect(lastEmitted().registrationDeadline.status).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().registrationDeadline.value).toEqual(null);
        });
      });
    });

    describe('parameter: votingDeadline', () => {
      describe('case: the contract cannot be retrieved from the index', () => {
        beforeEach(() => {
          spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "UNAVAILABLE"', () => {
          expect(lastEmitted().votingDeadline.status).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().votingDeadline.value).toEqual(null);
        });
      });

      describe('case: before the voting deadline is retrieved', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'votingDeadlineAt$').and.returnValue(Observable.never());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "RETRIEVING...', () => {
          expect(lastEmitted().votingDeadline.status).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().votingDeadline.value).toEqual(null);
        });
      });

      describe('case: after the voting deadline is retrieved', () => {
        beforeEach(() => init_detailsAtIndex$_and_subscribe());

        it('"status" should be "AVAILABLE', () => {
          expect(lastEmitted().votingDeadline.status).toEqual(RETRIEVAL_STATUS.AVAILABLE);
        });

        it('"value" should be set', () => {
          const deadline = new Date(Mock.AnonymousVotingContractCollections[index].timeframes.votingDeadline);
          expect(lastEmitted().votingDeadline.value).toEqual(deadline);
        });
      });

      describe('case: votingDeadlineAt$ returns an empty observable', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'votingDeadlineAt$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "UNAVAILABLE', () => {
          expect(lastEmitted().votingDeadline.status).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().votingDeadline.value).toEqual(null);
        });
      });
    });

    describe('parameter: pendingRegistrations', () => {
      describe('case: the contract cannot be retrieved from the index', () => {
        beforeEach(() => {
          spyOnProperty(voteListingSvc, 'deployedVotes$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "UNAVAILABLE"', () => {
          expect(lastEmitted().pendingRegistrations.status).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().pendingRegistrations.value).toEqual(null);
        });
      });

      describe('case: before the number of pending registrations is retrieved', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'pendingRegistrationsAt$').and.returnValue(Observable.never());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "RETRIEVING...', () => {
          expect(lastEmitted().pendingRegistrations.status).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().pendingRegistrations.value).toEqual(null);
        });
      });

      describe('case: after the number of pending registrations is retrieved', () => {
        beforeEach(() => init_detailsAtIndex$_and_subscribe());

        it('"status" should be "AVAILABLE', () => {
          expect(lastEmitted().pendingRegistrations.status).toEqual(RETRIEVAL_STATUS.AVAILABLE);
        });

        it('"value" should be set', () => {
          const pendingRegistrations = Mock.AnonymousVotingContractCollections[index].pendingRegistrations;
          expect(lastEmitted().pendingRegistrations.value).toEqual(pendingRegistrations);
        });
      });

      describe('case: the number of pending registrations is updated', () => {
        const mockPendingRegistrations = [3, 1, 5, 0, 2];
        let pendingRegistrations$: Subject<number>;

        beforeEach(() => {
          pendingRegistrations$ = new Subject();
          spyOn(anonymousVotingSvc, 'pendingRegistrationsAt$').and.returnValue(pendingRegistrations$);
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should stay as AVAILABLE', () => {
          mockPendingRegistrations.forEach(val => {
            pendingRegistrations$.next(val);
            expect(lastEmitted().pendingRegistrations.status).toEqual(RETRIEVAL_STATUS.AVAILABLE);
          });
        });

        it('"value" should be updated accordingly', () => {
          mockPendingRegistrations.forEach(val => {
            pendingRegistrations$.next(val);
            expect(lastEmitted().pendingRegistrations.value).toEqual(val);
          });
        });
      });

      describe('case: AnonymousVotingService.pendingRegistrations$ closes', () => {
        beforeEach(() => {
          spyOn(anonymousVotingSvc, 'pendingRegistrationsAt$').and.returnValue(Observable.empty());
          init_detailsAtIndex$_and_subscribe();
        });

        it('"status" should be "UNAVAILABLE"', () => {
          expect(lastEmitted().pendingRegistrations.status).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('"value" should be null', () => {
          expect(lastEmitted().pendingRegistrations.value).toEqual(null);
        });
      });
    });

    describe('parameter: votes', () => {
      xit('should handle individual vote hash errors individually (so one user cannot invalidate the whole vote)');

      xit('should confirm that all the votes have a valid signature');
    });
  });

  describe('method: blindSignatureAt$', () => {
    const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];
    const voter: IVoter = Mock.Voters[0];

    const init_blindSignatureAt$_and_subscribe = fakeAsync(() => {
      voteRetrievalSvc().blindSignatureAt$(voteCollection.address, voter.public_address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should emit the blind signature and complete', () => {
      init_blindSignatureAt$_and_subscribe();
      expect(onNext.calls.mostRecent().args[0]).toEqual(voter.signed_blinded_address);
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: the blind signature hash cannot be retrieved', () => {
      beforeEach(() => {
        spyOn(anonymousVotingSvc, 'blindSignatureHashAt$').and.returnValue(Observable.empty());
        init_blindSignatureAt$_and_subscribe();
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: the blind signature cannot be retrieved from the hash', () => {
      const error: Error = new Error('Unable to retrieve the blind signature');

      beforeEach(() => {
        spyOn(ipfsSvc, 'catJSON').and.returnValue(Promise.reject(error));
        init_blindSignatureAt$_and_subscribe();
      });

      it('should notify the Error service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(
          VoteRetrievalServiceErrors.ipfs.getBlindSignature(voteCollection.address, voter.public_address), error
        );
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: the retrieved blinded signature has the wrong format', () => {
      const invalid = {invalid: 'Not a valid blinded signature'};

      beforeEach(() => {
        spyOn(ipfsSvc, 'catJSON').and.returnValue(Promise.resolve(invalid));
        init_blindSignatureAt$_and_subscribe();
      });

      it('should notify the Error service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalServiceErrors.format.blindSignature(invalid), null);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});

