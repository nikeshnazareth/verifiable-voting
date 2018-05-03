import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { VoteManagerService, VoteManagerServiceErrors } from './vote-manager.service';
import {
  AnonymousVotingContractErrors,
  AnonymousVotingContractService
} from '../ethereum/anonymous-voting-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { Mock } from './vote-manager.service.spec.mock';
import { address } from '../ethereum/type.mappings';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import Spy = jasmine.Spy;

describe('Service: VoteManagerService', () => {
  let voteManagerSvc: VoteManagerService;
  let voteListingSvc: VoteListingContractService;
  let voteContractSvc: AnonymousVotingContractService;
  let ipfsSvc: IPFSService;
  let errSvc: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteManagerService,
        ErrorService,
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: AnonymousVotingContractService, useClass: Mock.AnonymousVotingContractService},
        {provide: IPFSService, useClass: Mock.IPFSService},
      ]
    });

    voteListingSvc = TestBed.get(VoteListingContractService);
    voteContractSvc = TestBed.get(AnonymousVotingContractService);
    ipfsSvc = TestBed.get(IPFSService);
    errSvc = TestBed.get(ErrorService);
  });

  const onError = err => fail(err);
  let onNext: Spy;
  let onCompleted: Spy;

  beforeEach(() => {
    onNext = jasmine.createSpy('onNext');
    onCompleted = jasmine.createSpy('onCompleted');
    spyOn(errSvc, 'add').and.stub();
  });

  describe('method: deployVote$', () => {

    const init_and_call_deployVote$ = () => {
      voteManagerSvc = new VoteManagerService(voteListingSvc, voteContractSvc, ipfsSvc, errSvc);
      voteManagerSvc.deployVote$(Mock.DUMMY_VOTE_PARAMETERS)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should add the hash to IPFS', fakeAsync(() => {
      spyOn(ipfsSvc, 'addJSON').and.callThrough();
      init_and_call_deployVote$();
      expect(ipfsSvc.addJSON).toHaveBeenCalledWith(Mock.DUMMY_VOTE_PARAMETERS);
    }));

    it('should pass the IPFS hash to VoteListingService.deployVote$', fakeAsync(() => {
      spyOn(voteListingSvc, 'deployVote$').and.callThrough();
      init_and_call_deployVote$();
      expect(voteListingSvc.deployVote$).toHaveBeenCalledWith(Mock.DUMMY_HASH);
    }));

    it('should return an observable that emits the transaction receipt and completes', fakeAsync(()=> {
      init_and_call_deployVote$();
      expect(onNext).toHaveBeenCalledWith(Mock.DUMMY_TX_RECEIPT);
      expect(onCompleted).toHaveBeenCalled();
    }));

    describe('case: IPFS call fails', () => {

      beforeEach(() => spyOn(ipfsSvc, 'addJSON').and.returnValue(Promise.reject('')));

      it('should notify the error service', fakeAsync(() => {
        init_and_call_deployVote$();
        expect(errSvc.add)
          .toHaveBeenCalledWith(VoteManagerServiceErrors.ipfs.addParametersHash(Mock.DUMMY_VOTE_PARAMETERS));
      }));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: deployVote$ (on the VoteListingService) fails', () => {

      beforeEach(() => spyOn(voteListingSvc, 'deployVote$').and.returnValue(Observable.empty()));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });
  });

  describe('method: getParameters', () => {

    const DUMMY_ADDRESS: address = 'DUMMY_ADDRESS';

    const init_and_call_getParameters$ = () => {
      voteManagerSvc = new VoteManagerService(voteListingSvc, voteContractSvc, ipfsSvc, errSvc);
      voteManagerSvc.getParameters$(DUMMY_ADDRESS)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    describe('case: contract exists', () => {

      describe('case: successfully retrieved parameters hash', () => {

        describe('case: successfully retrieved value from IPFS', () => {

          describe('case: value matches IVoteParameters interface', () => {
            it('should return an observable that emits the parameters object and completes', fakeAsync(() => {
              init_and_call_getParameters$();
              expect(onNext).toHaveBeenCalledWith(Mock.DUMMY_VOTE_PARAMETERS);
              expect(onNext).toHaveBeenCalledTimes(1);
              expect(onCompleted).toHaveBeenCalled();
            }));
          });

          describe('case: value does not match IVoteParameters interface', () => {
            const INVALID_VOTE_PARAMETERS = {
              invalid: 'INVALID'
            };

            beforeEach(() => spyOn(ipfsSvc, 'catJSON').and.returnValue(Promise.resolve(INVALID_VOTE_PARAMETERS)));

            it('should notify the Error Service', fakeAsync(() => {
              init_and_call_getParameters$();
              expect(errSvc.add)
                .toHaveBeenCalledWith(VoteManagerServiceErrors.format.parametersHash(INVALID_VOTE_PARAMETERS));
            }));

            it('should return an empty observable', fakeAsync(() => {
              init_and_call_getParameters$();
              expect(onNext).not.toHaveBeenCalled();
              expect(onCompleted).toHaveBeenCalled();
            }));
          });
        });

        describe('case: cannot retrieve value from IPFS', () => {

          beforeEach(() => spyOn(ipfsSvc, 'catJSON').and.returnValue(Promise.reject('')));

          it('should notify the Error Service', fakeAsync(() => {
            init_and_call_getParameters$();
            expect(errSvc.add)
              .toHaveBeenCalledWith(VoteManagerServiceErrors.ipfs.getParametersHash(DUMMY_ADDRESS, Mock.DUMMY_HASH));
          }));

          it('should return an empty observable', fakeAsync(() => {
            init_and_call_getParameters$();
            expect(onNext).not.toHaveBeenCalled();
            expect(onCompleted).toHaveBeenCalled();
          }));
        });
      });

      describe('case: cannot retrieve parameters hash', () => {

        beforeEach(() =>
          spyOn(Mock.ANONYMOUS_VOTING_CONTRACT.parametersHash, 'call').and.returnValue(Promise.reject(''))
        );

        it('should notify the Error Service', fakeAsync(() => {
          init_and_call_getParameters$();
          expect(errSvc.add)
            .toHaveBeenCalledWith(AnonymousVotingContractErrors.paramsHash(DUMMY_ADDRESS));
        }));

        it('should return an empty observable', fakeAsync(() => {
          init_and_call_getParameters$();
          expect(onNext).not.toHaveBeenCalled();
          expect(onCompleted).toHaveBeenCalled();
        }));
      });
    });

    describe('case: contract does not exist', () => {

      beforeEach(() => spyOn(voteContractSvc, 'contractAt').and.returnValue(Observable.empty()));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_getParameters$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });


  });
});
