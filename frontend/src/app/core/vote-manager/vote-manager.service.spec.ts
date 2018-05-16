import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { VoteManagerService, VoteManagerServiceErrors } from './vote-manager.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';
import Spy = jasmine.Spy;

describe('Service: VoteManagerService', () => {
  let voteManagerSvc: VoteManagerService;
  let voteListingSvc: VoteListingContractService;
  let ipfsSvc: IPFSService;
  let errSvc: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteManagerService,
        {provide: ErrorService, useClass: Mock.ErrorService},
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: IPFSService, useClass: Mock.IPFSService},
      ]
    });

    voteListingSvc = TestBed.get(VoteListingContractService);
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

  const voteDetails: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];

  describe('method: deployVote$', () => {

    const init_and_call_deployVote$ = () => {
      voteManagerSvc = new VoteManagerService(voteListingSvc, ipfsSvc, errSvc);
      voteManagerSvc.deployVote$(
        voteDetails.timeframes,
        voteDetails.parameters,
        voteDetails.eligibilityContract,
        voteDetails.registrationAuthority
      )
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should add the parameters to IPFS', fakeAsync(() => {
      spyOn(ipfsSvc, 'addJSON').and.callThrough();
      init_and_call_deployVote$();
      expect(ipfsSvc.addJSON).toHaveBeenCalledWith(voteDetails.parameters);
    }));

    it('should pass the IPFS hash and other parameters to VoteListingService.deployVote$', fakeAsync(() => {
      spyOn(voteListingSvc, 'deployVote$').and.callThrough();
      init_and_call_deployVote$();
      expect(voteListingSvc.deployVote$).toHaveBeenCalledWith(
        voteDetails.timeframes,
        voteDetails.params_hash,
        voteDetails.eligibilityContract,
        voteDetails.registrationAuthority
      );
    }));

    it('should return an observable that emits the transaction receipt and completes', fakeAsync(() => {
      init_and_call_deployVote$();
      expect(onNext).toHaveBeenCalledWith(voteDetails.deploy_receipt);
      expect(onCompleted).toHaveBeenCalled();
    }));

    describe('case: IPFS call fails', () => {

      const addError: Error = new Error('IPFS addJSON failed');

      beforeEach(() => spyOn(ipfsSvc, 'addJSON').and.returnValue(Promise.reject(addError)));

      it('should notify the error service', fakeAsync(() => {
        init_and_call_deployVote$();
        expect(errSvc.add)
          .toHaveBeenCalledWith(VoteManagerServiceErrors.ipfs.addParametersHash(voteDetails.parameters), addError);
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
});
