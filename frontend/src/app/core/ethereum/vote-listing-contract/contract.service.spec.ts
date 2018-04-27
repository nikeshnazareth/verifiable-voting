import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { IVoteListingContractService, VoteListingContractService } from './contract.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { ExpectedErrorWasNotThrown } from '../../../mocha.extensions';
import { VoteCreatedEvent } from './contract.api';
import { ErrorService } from '../../error-service/error.service';
import { Mock } from './contract.service.spec.mock';


describe('Service: VoteListingContractService', () => {
  // web3.sha3('DUMMY_PARAMS_HASH');
  const paramsHash: string = '0xe1affb9b7a982d2d184a5e6b9487744fa1937c1f10d958701615efcc4f4e0555';

  let voteListingContractSvc: IVoteListingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteListingContractService,
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: TruffleContractWrapperService, useClass: Mock.TruffleContractWrapperService},
      ]
    });

    voteListingContractSvc = TestBed.get(VoteListingContractService);
    web3Svc = TestBed.get(Web3Service);
    contractSvc = TestBed.get(TruffleContractWrapperService);
    errSvc = TestBed.get(ErrorService);
  });

  // create a reference to the dummy abstraction so it is easier to spy
  let abstraction: Mock.ITruffleContractAbstraction;
  beforeEach(() => {
    abstraction = new Mock.TruffleContractAbstraction();
    spyOn(contractSvc, 'wrap').and.callFake(definition => abstraction);
  });

  describe('constructor', () => {
    it('should raise an error with the ErrorService if web3 is not injected', fakeAsync(() => {
      const errorMsg: string = 'Not injected';
      spyOn(web3Svc, 'afterInjected').and.returnValue(Promise.reject(errorMsg));
      spyOn(errSvc, 'add').and.stub();
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(errorMsg);
    }));

    it('should raise an error with the ErrorService if the contract is not deployed', fakeAsync(() => {
      const errorMsg: string = 'VoteListing not deployed to network';
      spyOn(abstraction, 'deployed').and.throwError(errorMsg);
      spyOn(errSvc, 'add').and.stub();
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(Error(errorMsg));
    }));
  });

  describe('method: deployVote', () => {
    it('should fail if the contract was not initialised', done => {
      spyOn(web3Svc, 'afterInjected').and.returnValue(Promise.reject(''));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);

      voteListingContractSvc.deployVote(paramsHash)
        .then(() => {
          throw new ExpectedErrorWasNotThrown();
        })
        .catch(err => err instanceof ExpectedErrorWasNotThrown ? fail(err) : null)  // suppress the expected error
        .then(done);
    });


    it('should fail if contract.deploy fails', done => {
      spyOn(abstraction.contract, 'deploy').and.returnValue(Promise.reject('Deploy vote failed'));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote(paramsHash)
        .then(() => {
          throw new ExpectedErrorWasNotThrown();
        })
        .catch(err => err instanceof ExpectedErrorWasNotThrown ? fail(err) : null)  // suppress the expected error
        .then(done);
    });

    it('should return an empty promise', done => {
      voteListingContractSvc.deployVote(paramsHash)
        .then(result => expect(result).toBe(null))
        .then(done);
    });
  });

  describe('eventEmitter: voteCreated$', () => {
    const addr: string = 'dummy_address';
    const log: VoteCreatedEvent.Log = {
      event: VoteCreatedEvent.name,
      args: {
        contractAddress: addr
      }
    };
    const error: Error = new Error('Error Message');

    let eventHandler;
    beforeEach(() => {
      eventHandler = jasmine.createSpy('handleVoteCreated');
    });

    it('should track and pass-through the VoteCreated event on the VoteListing contract', done => {
      // wait for the initialisation promise to complete
      setTimeout(() => {
        voteListingContractSvc.voteCreated$.subscribe(eventHandler);
        abstraction.contract.eventStream.trigger(null, log);
        expect(eventHandler).toHaveBeenCalledWith(addr);
        done();
      });
    });

    it('should raise an error with the ErrorService if the contract event stream contains errors', done => {
      spyOn(errSvc, 'add').and.stub();
      // wait for the initialisation promise to complete
      setTimeout(() => {
        voteListingContractSvc.voteCreated$.subscribe(eventHandler);
        abstraction.contract.eventStream.trigger(error, null);
        expect(errSvc.add).toHaveBeenCalledWith(error);
        expect(eventHandler).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle interleaved log events and errors', done => {
      spyOn(errSvc, 'add').and.stub();
      // wait for the initialisation promise to complete
      setTimeout(() => {
        voteListingContractSvc.voteCreated$.subscribe(eventHandler);
        // 1. log event
        abstraction.contract.eventStream.trigger(null, log);
        expect(eventHandler).toHaveBeenCalledWith(addr);
        expect(errSvc.add).not.toHaveBeenCalled();
        // 2. error
        abstraction.contract.eventStream.trigger(error, null);
        expect(eventHandler).toHaveBeenCalledWith(addr);
        expect(errSvc.add).toHaveBeenCalledWith(error);
        // 3. log event
        abstraction.contract.eventStream.trigger(null, log);
        expect(eventHandler).toHaveBeenCalledTimes(2);
        expect(errSvc.add).toHaveBeenCalledTimes(1);
        // 4. log event
        abstraction.contract.eventStream.trigger(null, log);
        expect(eventHandler).toHaveBeenCalledTimes(3);
        expect(errSvc.add).toHaveBeenCalledTimes(1);
        // 5. error
        abstraction.contract.eventStream.trigger(error, null);
        expect(eventHandler).toHaveBeenCalledTimes(3);
        expect(errSvc.add).toHaveBeenCalledTimes(2);
        done();
      });
    });
  });
});

