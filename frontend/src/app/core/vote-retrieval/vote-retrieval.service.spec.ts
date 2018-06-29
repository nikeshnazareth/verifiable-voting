import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import 'rxjs/add/operator/distinctUntilChanged';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';
import { CryptographyService } from '../cryptography/cryptography.service';
import { ErrorService } from '../error-service/error.service';
import { IRegistrationHashes } from '../ethereum/anonymous-voting-contract/contract-manager';
import { VotePhases } from '../ethereum/anonymous-voting-contract/contract.constants';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IVoteParameters } from '../ipfs/formats.interface';
import { IPFSService } from '../ipfs/ipfs.service';
import Spy = jasmine.Spy;
import { VoteRetrievalErrors } from './vote-retreival-errors';
import {
  IDynamicValue,
  IRegistration, ISinglePendingRegistration,
  IVotingContractDetails,
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

          const unresolvedPromise: Promise<IVoteParameters> = new Promise(resolve => null);

          beforeEach(() => spyOn(ipfsSvc, 'catJSON').and.returnValue(unresolvedPromise));

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
              return idx === failedIndex ? Promise.reject(error) : Promise.resolve(mockParams[idx]);
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
              return idx === invalidIndex ? Promise.resolve(invalid_params) : Promise.resolve(mockParams[idx]);
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

    const lastEmitted: (() => IVotingContractDetails) = () => onNext.calls.mostRecent().args[0];


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
      let voteCollection: IAnonymousVotingContractCollection;

      beforeEach(() => {
        index = 0;
        voteCollection = Mock.AnonymousVotingContractCollections[index];
      });

      xdescribe('it should repeat the "summary" tests', () => {
      });

      xdescribe('parameter: key', () => {
      });

      xdescribe('parameter: candidates', () => {
      });

      xdescribe('parameter: registrationAuthority', () => {
      });

      describe('parameter: pendingRegistrations', () => {
        let incompleteRegHashes: IRegistrationHashes;

        beforeEach(() => {
          incompleteRegHashes = {};
          Mock.Voters.map((voter, idx) => {
            incompleteRegHashes[voter.public_address] = {
              blindedAddress: voter.blinded_address_hash,
              signature: idx % 2 ? null : voter.signed_blinded_address_hash
            };
          });

          spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
            const contractManager = new Mock.AnonymousVotingContractManager(addr);
            spyOnProperty(contractManager, 'registrationHashes$').and.returnValue(Observable.of(incompleteRegHashes));
            return contractManager;
          });
        });

        it('should return all pending blind addresses', () => {
          init_detailsAtIndex$_and_subscribe();
          const pendingRegistration: IDynamicValue<ISinglePendingRegistration[]> = lastEmitted().pendingRegistrations;
          expect(pendingRegistration.status).toEqual(RetrievalStatus.available);
          expect(pendingRegistration.value.length).toEqual(Mock.Voters.length / 2);
          Mock.Voters.filter((_, idx) => idx % 2).map(voter => {
            const matching = pendingRegistration.value.filter(pending => pending.voter === voter.public_address);
            expect(matching.length).toEqual(1);
            expect(matching[0].blindedAddress).toEqual(voter.blinded_address);
          });
        });

        xdescribe('case: before the registration hashes are retrieved', () => {
        });

        xdescribe('case: the registration hashes are unavailable', () => {
        });

        describe('case: there are no registration hashes', () => {
          beforeEach(() => {
            Object.keys(incompleteRegHashes).map(voter => {
              delete incompleteRegHashes[voter];
            });
            init_detailsAtIndex$_and_subscribe();
          });

          it('should return an empty list', () => {
            expect(lastEmitted().pendingRegistrations.status).toEqual(RetrievalStatus.available);
            expect(lastEmitted().pendingRegistrations.value).toEqual([]);
          });
        });

        describe('case: one of the blind address hashes is null', () => {
          beforeEach(() => {
            incompleteRegHashes[Mock.Voters[1].public_address].blindedAddress = null;
            init_detailsAtIndex$_and_subscribe();
          });

          it('should notify the error service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.ipfs.nullHash, null);
          });

          it('should be unavailable', () => {
            expect(lastEmitted().pendingRegistrations.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().pendingRegistrations.value).toEqual(null);
          });
        });

        xdescribe('case: one of the blind address hashes cannot be resolved', () => {
        });
      });

      describe('parameter: registration', () => {
        let completeRegHashes: IRegistrationHashes;

        beforeEach(() => {
          completeRegHashes = {};
          Mock.Voters.map(voter => {
            completeRegHashes[voter.public_address] = {
              blindedAddress: voter.blinded_address_hash,
              signature: voter.signed_blinded_address_hash
            };
          });

          spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
            const contractManager = new Mock.AnonymousVotingContractManager(addr);
            spyOnProperty(contractManager, 'registrationHashes$').and.returnValue(Observable.of(completeRegHashes));
            return contractManager;
          });
        });

        xdescribe('case: before the registration hashes are retrieved', () => {
        });

        xdescribe('case: the registration hashes are unavailable', () => {
        });

        describe('case: there are no registration hashes', () => {
          beforeEach(() => {
            Object.keys(completeRegHashes).map(voter => {
              delete completeRegHashes[voter];
            });
            init_detailsAtIndex$_and_subscribe();
          });

          it('should return an empty object', () => {
            expect(lastEmitted().registration.status).toEqual(RetrievalStatus.available);
            expect(lastEmitted().registration.value).toEqual({});
          });
        });

        describe('case: one of the blind address hashes is null', () => {
          beforeEach(() => {
            completeRegHashes[Mock.Voters[1].public_address].blindedAddress = null;
            init_detailsAtIndex$_and_subscribe();
          });

          it('should notify the error service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.ipfs.nullHash, null);
          });

          it('should be unavailable', () => {
            expect(lastEmitted().registration.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().registration.value).toEqual(null);
          });
        });

        describe('case: one of the blind signature hashes is null', () => {
          beforeEach(() => {
            completeRegHashes[Mock.Voters[1].public_address].signature = null;
            init_detailsAtIndex$_and_subscribe();
          });

          it('should be unavailable', () => {
            expect(lastEmitted().registration.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().registration.value).toEqual(null);
          });
        });

        xdescribe('case: one of the blind address hashes cannot be resolved', () => {
        });

        xdescribe('case: one of the blind signature hashes cannot be resolved', () => {
        });

        describe('case: one of the blind signatures does not match the blind address', () => {
          beforeEach(() => {
            completeRegHashes[Mock.Voters[1].public_address].signature = Mock.Voters[2].signed_blinded_address_hash;
            init_detailsAtIndex$_and_subscribe();
          });

          it('should notify the error service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.registration, null);
          });

          it('should be unavailable', () => {
            expect(lastEmitted().registration.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().registration.value).toEqual(null);
          });
        });

        describe('case: valid registration', () => {
          beforeEach(() => init_detailsAtIndex$_and_subscribe());

          it('should return all blind signatures', () => {
            const reg: IDynamicValue<IRegistration> = lastEmitted().registration;
            expect(reg.status).toEqual(RetrievalStatus.available);
            expect(Object.keys(reg.value).length).toEqual(Mock.Voters.length);
            Mock.Voters.map(voter => {
              expect(reg.value[voter.public_address]).toBeDefined();
              expect(reg.value[voter.public_address].blindSignature).toEqual(voter.signed_blinded_address);
            });
          });
        });
      });

      describe('parameter: results', () => {

        const create_voteHash_spy = (voteHashes) => {
          spyOn(anonymousVotingContractSvc, 'at').and.callFake(addr => {
            const contractManager = new Mock.AnonymousVotingContractManager(addr);
            spyOnProperty(contractManager, 'voteHashes$').and.returnValue(Observable.from(voteHashes));
            return contractManager;
          });
        };

        xdescribe('case: before the vote hashes are retrieved', () => {
        });

        xdescribe('case: the vote hashes are unavailable', () => {
        });

        describe('case: there are no vote hashes', () => {
          beforeEach(() => {
            create_voteHash_spy([]);
            init_detailsAtIndex$_and_subscribe();
          });

          it('should return a histogram of candidates with 0 votes ', () => {
            expect(lastEmitted().results.status).toEqual(RetrievalStatus.available);
            expect(lastEmitted().results.value)
              .toEqual(voteCollection.parameters.candidates.map(candidate => ({candidate: candidate, count: 0})));
          });
        });

        describe('case: one of the vote hashes is null', () => {
          beforeEach(() => {
            const voteHashes = Mock.Voters.map(voter => ({
              voter: voter.anonymous_address,
              voteHash: voter.vote_hash
            }));
            voteHashes[1].voteHash = null;
            create_voteHash_spy(voteHashes);
            init_detailsAtIndex$_and_subscribe();
          });

          it('should notify the error service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.ipfs.nullHash, null);
          });

          it('should be unavailable', () => {
            expect(lastEmitted().results.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().results.value).toEqual(null);
          });
        });

        describe('case: one of the vote hashes does not resolve', () => {
          beforeEach(() => {
            const voteHashes = Mock.Voters.map(voter => ({
              voter: voter.anonymous_address,
              voteHash: voter.vote_hash
            }));
            voteHashes[1].voteHash = 'INVALID_HASH';
            create_voteHash_spy(voteHashes);
            init_detailsAtIndex$_and_subscribe();
          });

          it('should notify the error service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.ipfs.retrieval, jasmine.any(Error));
          });

          it('should be unavailable', () => {
            expect(lastEmitted().results.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().results.value).toEqual(null);
          });
        });

        describe('case: one of the vote hashes resolves to an incorrectly formatted value', () => {
          const invalid = {
            voter: Mock.Voters[1].anonymous_address,
            voteHash: Mock.Voters[1].blinded_address_hash // an arbitrary hash that resolves to something else
          };

          beforeEach(() => {
            const voteHashes = Mock.Voters.map(voter => ({
              voter: voter.anonymous_address,
              voteHash: voter.vote_hash
            }));
            voteHashes[1] = invalid;
            create_voteHash_spy(voteHashes);
            init_detailsAtIndex$_and_subscribe();
          });

          it('should notify the error service', () => {
            expect(errSvc.add).toHaveBeenCalledWith(VoteRetrievalErrors.format.vote(invalid), null);
          });

          it('should be unavailable', () => {
            expect(lastEmitted().results.status).toEqual(RetrievalStatus.unavailable);
            expect(lastEmitted().results.value).toEqual(null);
          });
        });

        xdescribe('case: one of the vote hashes resolves to an invalid candidate index', () => {
        });

        describe('case: valid vote hashes', () => {
          beforeEach(() => {
            const voteHashes = Mock.Voters.map(voter => ({
              voter: voter.anonymous_address,
              voteHash: voter.vote_hash
            }));
            create_voteHash_spy(voteHashes);
            init_detailsAtIndex$_and_subscribe();
          });

          it('should return a histogram of the voter choices', () => {
            expect(lastEmitted().results.status).toEqual(RetrievalStatus.available);
            const results = lastEmitted().results.value;
            voteCollection.parameters.candidates.map((candidate, idx) => {
              const count = Mock.Voters.filter(voter => voter.vote.candidateIdx === idx).length;
              expect(results[idx]).toEqual({candidate: candidate, count: count});
            });
          });
        });
      });
    });

  });
});


