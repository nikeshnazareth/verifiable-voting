import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { IVoteListingContractService, VoteListingContractErrors, VoteListingContractService } from './contract.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { VoteCreatedEvent } from './contract.api';
import { ErrorService } from '../../error-service/error.service';
import { Mock } from './contract.service.spec.mock';
import { IContractLog } from '../contract.interface';
import { address, bytes32 } from '../type.mappings';
import { APP_CONFIG } from '../../../config';
import Spy = jasmine.Spy;


describe('Service: VoteListingContractService', () => {
  // web3.sha3('DUMMY_PARAMS_HASH');
  const paramsHash: bytes32 = '0xe1affb9b7a982d2d184a5e6b9487744fa1937c1f10d958701615efcc4f4e0555';

  let voteListingContractSvc: IVoteListingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  const addresses: address[] = [
    'address1',
    'address2',
    'address3',
    'address4'
  ];

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
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      spyOn(errSvc, 'add').and.stub();
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3);
    }));

    it('should notify the Error Service if the contract is not deployed', fakeAsync(() => {
      spyOn(abstraction, 'deployed').and.returnValue(Promise.reject('Network fail'));
      spyOn(errSvc, 'add').and.stub();
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.network);
    }));
  });

  describe('method: deployVote', () => {
    const testDeployError = () => {
      spyOn(errSvc, 'add').and.stub();
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote(paramsHash)
        .subscribe();
      tick();
      expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.deployVote);
    };

    const testDeployErrorReturnValue = () => {
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote(paramsHash)
        .subscribe(
          () => fail('The observable emitted a value'),
          () => fail('The observable threw an error'),
          () => fail('The observable completed')
        );
      tick();
    };

    it('should return an Observable that emits the transaction receipt and completes', fakeAsync(() => {
      const onNext: Spy = jasmine.createSpy();
      const onErr = err => fail(err);
      const onCompleted: Spy = jasmine.createSpy();

      // the service needs to be created within the fakeAsync block for tick() to advance the observable
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote(paramsHash)
        .subscribe(onNext, onErr, onCompleted);
      tick();

      expect(onNext).toHaveBeenCalledWith(Mock.DUMMY_TX_RECEIPT);
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalled();
    }));

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should notify the Error Service that deployVote fails', fakeAsync(() => {
        testDeployError();
      }));

      it('should return a stalled observable', fakeAsync(() => {
        testDeployErrorReturnValue();
      }));
    });

    describe('case: VoteListing contract is not deployed', () => {
      beforeEach(() => spyOn(abstraction, 'deployed').and.returnValue(Promise.reject('Network fail')));

      it('should notify the Error Service that deployVote fails', fakeAsync(() => {
        testDeployError();
      }));

      it('should return a stalled observable', fakeAsync(() => {
        testDeployErrorReturnValue();
      }));
    });

    describe('case: contract.deploy fails', () => {
      beforeEach(() => spyOn(abstraction.contract, 'deploy').and.returnValue(Promise.reject('Deploy vote failed')));

      it('should notify the Error Service that deployVote fails', fakeAsync(() => {
        testDeployError();
      }));

      it('should return a stalled observable', fakeAsync(() => {
        testDeployErrorReturnValue();
      }));
    });


  });

  describe('observable: deployedVotes$', () => {

    describe('initial value', () => {
      const testDeployedVotesError = () => {
        spyOn(errSvc, 'add').and.stub();
        // recreate the service (the constructor in the original has already been called)
        voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
        voteListingContractSvc.deployedVotes$
          .subscribe();
        tick();
        expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.deployedVotes);
      };

      const testDeployedVotesErrorReturnValue = () => {
        const onNext: Spy = jasmine.createSpy('onNext');
        const onError = () => fail('The observable threw an error');
        const onCompleted = () => fail('The observable completed');

        // recreate the service (the constructor in the original has already been called)
        voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
        voteListingContractSvc.deployedVotes$
          .subscribe(onNext, onError, onCompleted);
        tick();
        expect(onNext).toHaveBeenCalledWith([]);
      };

      it('should start with the list of contract addresses', fakeAsync(() => {

        abstraction.contract.setContractAddresses(addresses);

        const onNext: Spy = jasmine.createSpy('onNext');
        const onError = (err) => fail(err);
        const onCompleted = () => fail('deployedVotes$ completed');

        // the service needs to be created within the fakeAsync block for tick() to advance the observable
        voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
        voteListingContractSvc.deployedVotes$
          .subscribe(onNext, onError, onCompleted);
        tick();
        expect(onNext).toHaveBeenCalledWith(addresses);
      }));

      it('should start with an empty list if there are no addresses', fakeAsync(() => {
        const onNext: Spy = jasmine.createSpy('onNext');
        const onError = (err) => fail(err);
        const onCompleted = () => fail('deployedVotes$ completed');

        // the service needs to be created within the fakeAsync block for tick() to advance the observable
        voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
        voteListingContractSvc.deployedVotes$
          .subscribe(onNext, onError, onCompleted);
        tick();
        expect(onNext).toHaveBeenCalledWith([]);
      }));


      describe('case: web3 is not injected', () => {
        beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

        it('should notify the Error Service that deployedVotes$ does not contain existing contracts', fakeAsync(() => {
          testDeployedVotesError();
        }));

        it('should start with an empty list', fakeAsync(() => {
          testDeployedVotesErrorReturnValue();
        }));
      });

      describe('case: VoteListing contract is not deployed', () => {
        beforeEach(() => spyOn(abstraction, 'deployed').and.returnValue(Promise.reject('Network fail')));

        it('should notify the Error Service that deployedVotes$ does not contain existing contracts', fakeAsync(() => {
          testDeployedVotesError();
        }));

        it('should start with an empty list', fakeAsync(() => {
          testDeployedVotesErrorReturnValue();
        }));
      });

      describe('case: contract.numberOfVotingContracts fails', () => {
        beforeEach(() => {
          spyOn(abstraction.contract.numberOfVotingContracts, 'call').and.returnValue(Promise.reject('call fail'));
        });

        it('should notify the Error Service that deployedVotes$ does not contain existing contracts', fakeAsync(() => {
          testDeployedVotesError();
        }));

        it('should start with an empty list', fakeAsync(() => {
          testDeployedVotesErrorReturnValue();
        }));
      });

      describe('case: contract.votingContracts(i) fails for some indices', () => {

        beforeEach(() => {
          abstraction.contract.setContractAddresses(addresses);
          spyOn(abstraction.contract.votingContracts, 'call').and.callFake(idx => {
            if (idx === 0 || idx === 3) {
              return Promise.resolve(addresses[idx]);
            } else {
              return Promise.reject(`Failed to retrieve contract ${idx}`);
            }
          });
        });

        it('should notify the Error Service for every unavailable contract', fakeAsync(() => {
          spyOn(errSvc, 'add').and.stub();
          // recreate the service (the constructor in the original has already been called)
          voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
          voteListingContractSvc.deployedVotes$
            .subscribe();
          tick();
          expect(errSvc.add).not.toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(0));
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(1));
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(2));
          expect(errSvc.add).not.toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(3));
        }));

        it('should start with the list of available contracts', fakeAsync(() => {
          const onNext: Spy = jasmine.createSpy('onNext');
          const onError = (err) => fail(err);
          const onCompleted = () => fail('deployedVotes$ completed');

          // the service needs to be created within the fakeAsync block for tick() to advance the observable
          voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
          voteListingContractSvc.deployedVotes$
            .subscribe(onNext, onError, onCompleted);
          tick();
          expect(onNext).toHaveBeenCalledWith([addresses[0], addresses[3]]);
        }));
      });
    });

    describe('subsequent values', () => {

      let onNext: Spy;
      const onError = (err) => fail(err);
      const onCompleted = () => fail('deployedVotes$ completed');

      beforeEach(() => {
        abstraction.contract.setContractAddresses(addresses);
        onNext = jasmine.createSpy('onNext');
      });

      const init_deployedVotes$_handlers = () => {
        // the service needs to be created within the fakeAsync block for tick() to advance the observable
        voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
        voteListingContractSvc.deployedVotes$
          .subscribe(onNext, onError, onCompleted);
        tick();
        expect(onNext).toHaveBeenCalledWith(addresses);
        expect(onNext).toHaveBeenCalledTimes(1);
      };

      const newLog = (idx) => ({
        event: VoteCreatedEvent.name,
        args: {
          contractAddress: `New address ${idx}`
        }
      });

      it('should emit a new event whenever the VoteListing contract emits a VoteCreated event', fakeAsync(() => {
        init_deployedVotes$_handlers();
        abstraction.contract.eventStream.trigger(null, newLog(1));
        expect(onNext).toHaveBeenCalledTimes(2);

        abstraction.contract.eventStream.trigger(null, newLog(2));
        expect(onNext).toHaveBeenCalledTimes(3);
      }));

      it('should concatenate all addresses per emitted event', fakeAsync(() => {
        init_deployedVotes$_handlers();
        abstraction.contract.eventStream.trigger(null, newLog(1));
        const secondEvent: address[] = addresses.concat(newLog(1).args.contractAddress);
        expect(onNext).toHaveBeenCalledWith(secondEvent);
        expect(onNext).toHaveBeenCalledTimes(2);

        abstraction.contract.eventStream.trigger(null, newLog(2));
        const thirdEvent: address[] = secondEvent.concat(newLog(2).args.contractAddress);
        expect(onNext).toHaveBeenCalledWith(thirdEvent);
        expect(onNext).toHaveBeenCalledTimes(3);
      }));

      describe('case: the event stream contains an error', () => {
        const streamError: Error = new Error('Error in event stream');

        it('should notify the Error Service if the contract event stream contains an error', fakeAsync(() => {
          spyOn(errSvc, 'add').and.stub();
          init_deployedVotes$_handlers();
          abstraction.contract.eventStream.trigger(streamError, null);
          expect(errSvc.add).toHaveBeenCalledWith(streamError);
        }));

        it('should not affect the deployedVotes$ stream', fakeAsync(() => {
          init_deployedVotes$_handlers();
          abstraction.contract.eventStream.trigger(streamError, null);
          expect(onNext).toHaveBeenCalledTimes(1);
          // onError and onCompleted will fail the test, so we don't need to check for them
        }));
      });

      it('should ignore non-VoteCreated events', fakeAsync(() => {
        const otherEvent: IContractLog = {
          event: 'Another event',
          args: {
            param1: 'param1',
            param2: 1
          }
        };
        init_deployedVotes$_handlers();
        abstraction.contract.eventStream.trigger(null, otherEvent);
        expect(onNext).toHaveBeenCalledTimes(1);
        // onError and onCompleted will fail the test, so we don't need to check for them
      }));

      it('should handle interleaved VoteCreated and error events', fakeAsync(() => {
        const streamError: Error = new Error('Error in event stream');
        spyOn(errSvc, 'add').and.stub();
        init_deployedVotes$_handlers();

        let nEvents: number = 1;
        let nErrors: number = 0;
        let lastEvent: address[] = addresses;

        const checkExpectations = () => {
          expect(onNext).toHaveBeenCalledWith(lastEvent);
          expect(onNext).toHaveBeenCalledTimes(nEvents);
          expect(errSvc.add).toHaveBeenCalledTimes(nErrors);
        };

        const logEvent = () => {
          abstraction.contract.eventStream.trigger(null, newLog(nEvents));
          lastEvent = lastEvent.concat(newLog(nEvents).args.contractAddress);
          nEvents++;
        };

        const errEvent = () => {
          abstraction.contract.eventStream.trigger(streamError, null);
          nErrors++;
        };

        logEvent();
        checkExpectations();
        errEvent();
        checkExpectations();
        logEvent();
        checkExpectations();
        logEvent();
        checkExpectations();
        errEvent();
        checkExpectations();
     }));

    });

  });
});

