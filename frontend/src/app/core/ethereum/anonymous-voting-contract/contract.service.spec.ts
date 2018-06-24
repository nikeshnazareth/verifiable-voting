import { fakeAsync, TestBed, tick } from '@angular/core/testing';


import { IWeb3Service, Web3Service } from '../web3.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { ErrorService } from '../../error-service/error.service';
import { APP_CONFIG } from '../../../config';
import { Mock } from '../../../mock/module';
import { AnonymousVotingContractService } from './contract.service';

describe('Service: AnonymousVotingContractService', () => {
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;
  const anonymousVotingSvc = () => new AnonymousVotingContractService(web3Svc, contractSvc, errSvc);


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnonymousVotingContractService,
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: TruffleContractWrapperService, useClass: Mock.TruffleAnonymousVotingWrapperService}
      ]
    });

    web3Svc = TestBed.get(Web3Service);
    contractSvc = TestBed.get(TruffleContractWrapperService);
    errSvc = TestBed.get(ErrorService);
  });

  beforeEach(() => {
    spyOn(errSvc, 'add').and.stub();
  });

  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      anonymousVotingSvc();
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3, null);
    }));
  });

  describe('method: at', () => {

    describe('case: the first time the address is queried', () => {
      xit('should create a new AnonymousVotingContractManager', () => {
      });

      xit('should pass an observable that emits the contract and completes to the AnonymousVotingContractManager');

      xit('should return the AnonymousVotingContractManager object');
    });

    describe('case: the second time the address is queried', () => {
      xit('should return the original AnonymousVotingContractManager object');
    });

    describe('case: the specified address is invalid', () => {
      xit('should notify the Error Service');

      xit('should pass an empty observable to the AnonymousVotingContractManager');
    });
  });
});



