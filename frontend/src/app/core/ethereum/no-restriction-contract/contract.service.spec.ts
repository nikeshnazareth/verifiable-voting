import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../../../config';
import { Mock } from '../../../mock/module';
import { ErrorService } from '../../error-service/error.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import {
  INoRestrictionContractService, NoRestrictionContractErrors,
  NoRestrictionContractService
} from './contract.service';

describe('Service: NoRestrictionContractService', () => {
  let noRestrictionSvc: INoRestrictionContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NoRestrictionContractService,
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: TruffleContractWrapperService, useClass: Mock.TruffleNoRestrictionWrapperService},
      ]
    });

    web3Svc = TestBed.get(Web3Service);
    contractSvc = TestBed.get(TruffleContractWrapperService);
    errSvc = TestBed.get(ErrorService);
    spyOn(errSvc, 'add').and.stub();
  });

  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', () => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      noRestrictionSvc = new NoRestrictionContractService(web3Svc, contractSvc, errSvc);
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3, null);
    });
  });

  describe('property: address', () => {
    it('should resolve with the contract address', done => {
      noRestrictionSvc = new NoRestrictionContractService(web3Svc, contractSvc, errSvc);
      noRestrictionSvc.address
        .then(addr => expect(addr).toEqual(Mock.NO_RESTRICTION_ADDRESS))
        .then(done);
    });

    describe('case: web3 is not injected', () => {
      beforeEach(() => {
        spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
        noRestrictionSvc = new NoRestrictionContractService(web3Svc, contractSvc, errSvc);
      });

      it('should resolve with null', done => {
        noRestrictionSvc.address
          .then(addr => expect(addr).toEqual(null))
          .then(done);
      });
    });

    describe('case: NoRestriction contract is not deployed', () => {
      const notDeployed: Error = new Error('NoRestriction contract not deployed');

      beforeEach(() => {
        spyOn(Mock.TruffleNoRestrictionAbstraction, 'deployed').and
          .returnValue(Promise.reject(notDeployed));
        noRestrictionSvc = new NoRestrictionContractService(web3Svc, contractSvc, errSvc);
      });

      it('should notify the Error service', done => {
        noRestrictionSvc.address
          .then(() => expect(errSvc.add).toHaveBeenCalledWith(NoRestrictionContractErrors.network, notDeployed))
          .then(done);
      });

      it('should resolve with null', done => {
        noRestrictionSvc.address
          .then(addr => expect(addr).toEqual(null))
          .then(done);
      });
    });
  });

});

