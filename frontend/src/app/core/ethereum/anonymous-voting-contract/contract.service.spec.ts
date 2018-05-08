import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import {
  AnonymousVotingContractErrors, AnonymousVotingContractService,
  IAnonymousVotingContractService
} from './contract.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { ErrorService } from '../../error-service/error.service';
import { APP_CONFIG } from '../../../config';
import { IAnonymousVotingContractCollection, Mock } from '../../../mock/module';
import Spy = jasmine.Spy;

describe('Service: AnonymousVotingContractService', () => {
  let anonymousVotingSvc: IAnonymousVotingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

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

  describe('method: contractAt', () => {
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



