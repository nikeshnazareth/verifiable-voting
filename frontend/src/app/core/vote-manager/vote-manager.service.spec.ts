import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { AnonymousVotingContractManager } from '../../mock/anonymous-voting-contract/contract-manager';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../mock/module';
import { CryptographyService } from '../cryptography/cryptography.service';
import { ErrorService } from '../error-service/error.service';
import { AnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { VoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { TransactionService } from '../transaction-service/transaction.service';
import Spy = jasmine.Spy;
import { VoteManagerErrors } from './vote-manager-errors';
import { VoteManagerMessages } from './vote-manager-messages';
import { VoteManagerService } from './vote-manager.service';

describe('Service: VoteManagerService', () => {
  let voteListingSvc: VoteListingContractService;
  let anonymousVotingContractSvc: AnonymousVotingContractService;
  let cryptoSvc: CryptographyService;
  let txSvc: TransactionService;
  let ipfsSvc: IPFSService;
  let errSvc: ErrorService;

  const voteManagerSvc = () => new VoteManagerService(voteListingSvc, anonymousVotingContractSvc, cryptoSvc, txSvc, ipfsSvc, errSvc);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteManagerService,
        ErrorService,
        TransactionService,
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: AnonymousVotingContractService, useClass: Mock.AnonymousVotingContractService},
        {provide: CryptographyService, useClass: Mock.CryptographyService},
        {provide: IPFSService, useClass: Mock.IPFSService},
      ]
    });

    voteListingSvc = TestBed.get(VoteListingContractService);
    anonymousVotingContractSvc = TestBed.get(AnonymousVotingContractService);
    cryptoSvc = TestBed.get(CryptographyService);
    txSvc = TestBed.get(TransactionService);
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
    spyOn(txSvc, 'add').and.callThrough();
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

    it('should pass the deploy message to the Transaction Service', fakeAsync(() => {
      init_and_call_deployVote$();
      expect(txSvc.add).toHaveBeenCalledWith(
        jasmine.anything(), VoteManagerMessages.deploy(voteDetails.parameters.topic)
      );
    }));

    it('should return an observable that emits nothing and completes', fakeAsync(() => {
      init_and_call_deployVote$();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(undefined);
      expect(onCompleted).toHaveBeenCalled();
    }));

    describe('case: IPFS call fails', () => {

      const addError: Error = new Error('IPFS addJSON failed');

      beforeEach(() => spyOn(ipfsSvc, 'addJSON').and.returnValue(Observable.throwError(addError)));

      it('should notify the error service', fakeAsync(() => {
        init_and_call_deployVote$();
        expect(errSvc.add)
          .toHaveBeenCalledWith(VoteManagerErrors.ipfs.addParametersHash(voteDetails.parameters), addError);
      }));

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

    it('should get the AnonymousVotingContractManager at the contract address', () => {
      spyOn(anonymousVotingContractSvc, 'at').and.callThrough();
      init_and_call_registerAt$();
      expect(anonymousVotingContractSvc.at).toHaveBeenCalledWith(voteDetails.address);
    });

    it('should pass the IPFS hash and public addresses to AnonymousVotingContractManager.register$', () => {
      const contractManager = new AnonymousVotingContractManager(voteDetails.address);
      spyOn(anonymousVotingContractSvc, 'at').and.returnValue(contractManager);
      spyOn(contractManager, 'register$').and.callThrough();
      init_and_call_registerAt$();
      expect(contractManager.register$).toHaveBeenCalledWith(voter.public_address, voter.blinded_address_hash);
    });

    it('should pass the register message to the Transaction Service', () => {
      init_and_call_registerAt$();
      expect(txSvc.add).toHaveBeenCalledWith(
        jasmine.anything(), VoteManagerMessages.register()
      );
    });

    it('should return an observable that emits nothing and completed', () => {
      init_and_call_registerAt$();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(undefined);
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

      beforeEach(() => spyOn(ipfsSvc, 'addJSON').and.returnValue(Observable.throwError(addError)));

      it('should notify the error service', () => {
        init_and_call_registerAt$();
        expect(errSvc.add)
          .toHaveBeenCalledWith(VoteManagerErrors.ipfs.addBlindedAddress(), addError);
      });

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

    it('should get the AnonymousVotingContractManager at the contract address', () => {
      spyOn(anonymousVotingContractSvc, 'at').and.callThrough();
      init_and_call_voteAt$();
      expect(anonymousVotingContractSvc.at).toHaveBeenCalledWith(voteDetails.address);
    });

    it('should pass the anonymous address and vote hash to AnonymousVotingContractManager.vote$', () => {
      const contractManager = new AnonymousVotingContractManager(voteDetails.address);
      spyOn(anonymousVotingContractSvc, 'at').and.returnValue(contractManager);
      spyOn(contractManager, 'vote$').and.callThrough();
      init_and_call_voteAt$();
      expect(contractManager.vote$).toHaveBeenCalledWith(voter.anonymous_address, voter.vote_hash);
    });

    it('should pass the vote message to the Transaction Service', () => {
      init_and_call_voteAt$();
      expect(txSvc.add).toHaveBeenCalledWith(
        jasmine.anything(), VoteManagerMessages.vote()
      );
    });

    it('should return an observable that emits nothing and completes', () => {
      init_and_call_voteAt$();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith(undefined);
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
        expect(errSvc.add).toHaveBeenCalledWith(VoteManagerErrors.unauthorised(), null);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: adding the vote to IPFS fails', () => {
      const error: Error = new Error('Unable to add vote to IPFS');
      beforeEach(() => {
        spyOn(ipfsSvc, 'addJSON').and.returnValue(Observable.throwError(error));
        init_and_call_voteAt$();
      });

      it('should notify the Error Service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(VoteManagerErrors.ipfs.addVote(), error);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});
