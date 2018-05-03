import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { VoteManagerService, VoteManagerServiceErrors } from './vote-manager.service';
import {
  AnonymousVotingContractErrors,
  AnonymousVotingContractService
} from '../ethereum/anonymous-voting-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';
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
        {provide: ErrorService, useClass: Mock.ErrorService},
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
  });

  const VoteDetails: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];

  describe('method: deployVote$', () => {


    const init_and_call_deployVote$ = () => {
      voteManagerSvc = new VoteManagerService(voteListingSvc, voteContractSvc, ipfsSvc, errSvc);
      voteManagerSvc.deployVote$(VoteDetails.parameters)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should add the hash to IPFS', fakeAsync(() => {
      spyOn(ipfsSvc, 'addJSON').and.callThrough();
      init_and_call_deployVote$();
      expect(ipfsSvc.addJSON).toHaveBeenCalledWith(VoteDetails.parameters);
    }));

    it('should pass the IPFS hash to VoteListingService.deployVote$', fakeAsync(() => {
      spyOn(voteListingSvc, 'deployVote$').and.callThrough();
      init_and_call_deployVote$();
      expect(voteListingSvc.deployVote$).toHaveBeenCalledWith(VoteDetails.params_hash);
    }));

    it('should return an observable that emits the transaction receipt and completes', fakeAsync(() => {
      init_and_call_deployVote$();
      expect(onNext).toHaveBeenCalledWith(VoteDetails.deploy_receipt);
      expect(onCompleted).toHaveBeenCalled();
    }));

    describe('case: IPFS call fails', () => {

      beforeEach(() => spyOn(ipfsSvc, 'addJSON').and.returnValue(Promise.reject('')));

      it('should notify the error service', fakeAsync(() => {
        init_and_call_deployVote$();
        expect(errSvc.add)
          .toHaveBeenCalledWith(VoteManagerServiceErrors.ipfs.addParametersHash(VoteDetails.parameters));
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

    const init_and_call_getParameters$ = () => {
      voteManagerSvc = new VoteManagerService(voteListingSvc, voteContractSvc, ipfsSvc, errSvc);
      voteManagerSvc.getParameters$(VoteDetails.address)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    describe('case: contract exists', () => {

      describe('case: successfully retrieved parameters hash', () => {

        describe('case: successfully retrieved value from IPFS', () => {

          describe('case: value matches IVoteParameters interface', () => {
            it('should return an observable that emits the parameters object and completes', fakeAsync(() => {
              init_and_call_getParameters$();
              expect(onNext).toHaveBeenCalledWith(VoteDetails.parameters);
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
              .toHaveBeenCalledWith(
                VoteManagerServiceErrors.ipfs.getParametersHash(VoteDetails.address, VoteDetails.params_hash)
              );
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
          spyOn(VoteDetails.instance.parametersHash, 'call').and.returnValue(Promise.reject(''))
        );

        it('should notify the Error Service', fakeAsync(() => {
          init_and_call_getParameters$();
          expect(errSvc.add)
            .toHaveBeenCalledWith(AnonymousVotingContractErrors.paramsHash(VoteDetails.address));
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
