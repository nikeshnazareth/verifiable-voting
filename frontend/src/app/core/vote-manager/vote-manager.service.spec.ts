import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { VoteManagerService, VoteManagerServiceErrors } from './vote-manager.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { ErrorService } from '../error-service/error.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../mock/module';
import { CryptographyService } from '../cryptography/cryptography.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import Spy = jasmine.Spy;

describe('Service: VoteManagerService', () => {
  let voteListingSvc: VoteListingContractService;
  let anonymousVotingSvc: AnonymousVotingContractService;
  let cryptoSvc: CryptographyService;
  let ipfsSvc: IPFSService;
  let errSvc: ErrorService;

  const voteManagerSvc = () => new VoteManagerService(voteListingSvc, anonymousVotingSvc, cryptoSvc, ipfsSvc, errSvc);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteManagerService,
        ErrorService,
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: AnonymousVotingContractService, useClass: Mock.AnonymousVotingContractService},
        {provide: CryptographyService, useClass: Mock.CryptographyService},
        {provide: IPFSService, useClass: Mock.IPFSService},
      ]
    });

    voteListingSvc = TestBed.get(VoteListingContractService);
    anonymousVotingSvc = TestBed.get(AnonymousVotingContractService);
    cryptoSvc = TestBed.get(CryptographyService);
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

  const voteDetails: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];
  const voter: IVoter = Mock.Voters[0];

  describe('method: deployVote$', () => {

    const init_and_call_deployVote$ = () => {
      voteManagerSvc().deployVote$(
        voteDetails.voteConstants.registrationDeadline,
        voteDetails.voteConstants.votingDeadline,
        voteDetails.parameters,
        voteDetails.voteConstants.eligibilityContract,
        voteDetails.voteConstants.registrationAuthority
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
      expect(voteListingSvc.deployVote$).toHaveBeenCalledWith(voteDetails.voteConstants);
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

  describe('method: registerAt$', () => {

    const init_and_call_registerAt$ = fakeAsync(() => {
      voteManagerSvc().registerAt$(
        voteDetails.address,
        voteDetails.parameters.registration_key,
        voter.public_address,
        voter.anonymous_address,
        voter.blinding_factor
      )
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should use the Cryptography service to determine the RSA blinded address', () => {
      spyOn(cryptoSvc, 'blind').and.callThrough();
      init_and_call_registerAt$();
      expect(cryptoSvc.blind).toHaveBeenCalledWith(
        voter.anonymous_address, voter.blinding_factor, voteDetails.parameters.registration_key
      );
    });

    it('should add the blinded address to IPFS', () => {
      spyOn(ipfsSvc, 'addJSON').and.callThrough();
      init_and_call_registerAt$();
      expect(ipfsSvc.addJSON).toHaveBeenCalledWith({blinded_address: voter.blinded_address});
    });

    it('should pass the IPFS hash and public addresses to AnonymousVotingContractService.registerAt$', () => {
      spyOn(anonymousVotingSvc, 'registerAt$').and.callThrough();
      init_and_call_registerAt$();
      expect(anonymousVotingSvc.registerAt$).toHaveBeenCalledWith(
        voteDetails.address, voter.public_address, voter.blinded_address_hash
      );
    });

    it('should return an observable that emits the transaction receipt and completed', () => {
      init_and_call_registerAt$();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(voter.register_receipt);
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: the Cryptography service returns null', () => {
      beforeEach(() => spyOn(cryptoSvc, 'blind').and.returnValue(null));

      it('should return an empty observable', () => {
        init_and_call_registerAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: the IPFS call fails', () => {
      const addError: Error = new Error('IPFS addJSON failed');

      beforeEach(() => spyOn(ipfsSvc, 'addJSON').and.returnValue(Promise.reject(addError)));

      it('should notify the error service', () => {
        init_and_call_registerAt$();
        expect(errSvc.add)
          .toHaveBeenCalledWith(VoteManagerServiceErrors.ipfs.addBlindedAddress(), addError);
      });

      it('should return an empty observable', () => {
        init_and_call_registerAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: registerAt$ (on the AnonymousVotingContractService) fails', () => {
      beforeEach(() => spyOn(anonymousVotingSvc, 'registerAt$').and.returnValue(Observable.empty()));

      it('should return an empty observable', () => {
        init_and_call_registerAt$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('method: voteAt$', () => {
    const init_and_call_voteAt$ = fakeAsync(() => {
      voteManagerSvc().voteAt$(
        voteDetails.address,
        voteDetails.parameters.registration_key,
        voter.anonymous_address,
        voter.signed_blinded_address,
        voter.blinding_factor,
        voter.vote.candidateIdx
      )
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should use the Cryptography service to determine the signed address', () => {
      spyOn(cryptoSvc, 'unblind').and.callThrough();
      init_and_call_voteAt$();
      expect(cryptoSvc.unblind).toHaveBeenCalledWith(
        voter.signed_blinded_address, voter.blinding_factor, voteDetails.parameters.registration_key
      );
    });

    it('should use the Cryptography service to confirm the anonymous address matches the unblinded address', () => {
      spyOn(cryptoSvc, 'verify').and.callThrough();
      init_and_call_voteAt$();
      expect(cryptoSvc.verify).toHaveBeenCalledWith(
        voter.anonymous_address, voter.vote.signed_address, voteDetails.parameters.registration_key
      );
    });

    it('should add the vote to IPFS', () => {
      spyOn(ipfsSvc, 'addJSON').and.callThrough();
      init_and_call_voteAt$();
      expect(ipfsSvc.addJSON).toHaveBeenCalledWith(voter.vote);
    });

    it('should pass the anonymous address and vote hash to the AnonymousVotingService', () => {
      spyOn(anonymousVotingSvc, 'voteAt$').and.callThrough();
      init_and_call_voteAt$();
      expect(anonymousVotingSvc.voteAt$)
        .toHaveBeenCalledWith(voteDetails.address, voter.anonymous_address, voter.vote_hash);
    });

    it('should return an observable that emits the vote receipt and completes', () => {
      init_and_call_voteAt$();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(voter.vote_receipt);
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: the Cryptography service cannot unblind the signature', () => {
      beforeEach(() => {
        spyOn(cryptoSvc, 'unblind').and.returnValue(null);
        init_and_call_voteAt$();
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: the anonymous address does not match the unblinded address', () => {
      beforeEach(() => {
        spyOn(cryptoSvc, 'verify').and.returnValue(false);
        init_and_call_voteAt$();
      });

      it('should notify the Error Service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(VoteManagerServiceErrors.unauthorised(), null);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: adding the vote to IPFS fails', () => {
      const error: Error = new Error('Unable to add vote to IPFS');
      beforeEach(() => {
        spyOn(ipfsSvc, 'addJSON').and.returnValue(Promise.reject(error));
        init_and_call_voteAt$();
      });

      it('should notify the Error Service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(VoteManagerServiceErrors.ipfs.addVote(), error);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: the AnonymousVotingService call return an empty observable', () => {
      beforeEach(() => {
        spyOn(anonymousVotingSvc, 'voteAt$').and.returnValue(Observable.empty());
        init_and_call_voteAt$();
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});
