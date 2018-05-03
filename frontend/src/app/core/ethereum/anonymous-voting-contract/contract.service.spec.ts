import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import {
  AnonymousVotingContractErrors, AnonymousVotingContractService,
  IAnonymousVotingContractService
} from './contract.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import {
  ITruffleContractAbstraction, ITruffleContractWrapperService,
  TruffleContractWrapperService
} from '../truffle-contract.service';
import { ErrorService } from '../../error-service/error.service';
import { Mock } from './contract.service.spec.mock';
import { APP_CONFIG } from '../../../config';
import { address } from '../type.mappings';
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
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: TruffleContractWrapperService, useClass: Mock.TruffleContractWrapperService},
      ]
    });

    web3Svc = TestBed.get(Web3Service);
    contractSvc = TestBed.get(TruffleContractWrapperService);
    errSvc = TestBed.get(ErrorService);
  });

  // create a reference to the dummy abstraction so it is easier to spy
  let abstraction: ITruffleContractAbstraction;
  beforeEach(() => {
    abstraction = new Mock.TruffleContractAbstraction();
    spyOn(contractSvc, 'wrap').and.callFake(definition => abstraction);
  });


  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      spyOn(errSvc, 'add').and.stub();
      anonymousVotingSvc = new AnonymousVotingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3);
    }));
  });

  describe('method: contractAt', () => {
    const addr: address = '_address_';
    const onError = (err) => fail(err);
    let onNext: Spy;
    let onCompleted: Spy;

    beforeEach(() => {
      onNext = jasmine.createSpy('onNext');
      onCompleted = jasmine.createSpy('onCompleted');
    });

    const init_svc_and_contractAt_handlers = () => {
      anonymousVotingSvc = new AnonymousVotingContractService(<Web3Service> web3Svc, contractSvc, errSvc);

      anonymousVotingSvc.contractAt(addr)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should return an observable that emits the contract and completes', fakeAsync(() => {
      init_svc_and_contractAt_handlers();
      expect(onNext).toHaveBeenCalledWith(Mock.RETURNED_CONTRACT);
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
        spyOn(abstraction, 'at').and.returnValue(Promise.reject(contractUnavailable));
        spyOn(errSvc, 'add').and.stub();
        init_svc_and_contractAt_handlers();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.network(addr));
      }));

      it('should return an empty observable', fakeAsync(() => {
        const contractUnavailable: Error = new Error('Cannot find contract at address');
        spyOn(abstraction, 'at').and.returnValue(Promise.reject(contractUnavailable));
        init_svc_and_contractAt_handlers();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalledTimes(1);
      }));
    });
  });
});



