import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { IVoteListingContractService, VoteListingContractErrors, VoteListingContractService } from './contract.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { VoteCreatedEvent } from './contract.api';
import { ErrorService } from '../../error-service/error.service';
import { Mock } from './contract.service.spec.mock';
import { IContractLog } from '../contract.interface';
import { address } from '../type.mappings';
import { APP_CONFIG } from '../../../config';
import Spy = jasmine.Spy;


describe('Service: VoteListingContractService', () => {
  const paramsHash: string = 'DUMMY_PARAMS_HASH';

  let voteListingContractSvc: IVoteListingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  const DUMMY_ADDRESSES: address[] = [
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

  const onError = (err) => fail(err);
  let onNext: Spy, onCompleted: Spy;

  beforeEach(() => {
    onNext = jasmine.createSpy('onNext');
    onCompleted = jasmine.createSpy('onCompleted');
    spyOn(errSvc, 'add').and.stub();
  });

  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3);
    }));

    it('should notify the Error Service if the contract is not deployed', fakeAsync(() => {
      spyOn(abstraction, 'deployed').and.returnValue(Promise.reject('Network fail'));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.network);
    }));
  });

  describe('method: deployVote', () => {
    const init_and_call_deployVote = () => {
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote$(paramsHash)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should return an Observable that emits the transaction receipt and completes', fakeAsync(() => {
      init_and_call_deployVote();
      expect(onNext).toHaveBeenCalledWith(Mock.DUMMY_TX_RECEIPT);
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalled();
    }));

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: VoteListing contract is not deployed', () => {
      beforeEach(() => spyOn(abstraction, 'deployed').and.returnValue(Promise.reject('Network fail')));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: contract.deploy fails', () => {
      beforeEach(() => spyOn(abstraction.contract, 'deploy').and.returnValue(Promise.reject('Deploy vote failed')));

      it('should notify the Error Service that deployVote fails', fakeAsync(() => {
        init_and_call_deployVote();
        expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.deployVote);
      }));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });
  });

  describe('observable: deployedVotes$', () => {
    const init_and_call_deployedVotes$ = () => {
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployedVotes$
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    describe('case: before VoteCreated events', () => {
      it('should emit the contract addresses', fakeAsync(() => {
        abstraction.contract.setContractAddresses(DUMMY_ADDRESSES);
        init_and_call_deployedVotes$();
        expect(onNext.calls.allArgs()).toEqual(DUMMY_ADDRESSES.map(addr => [addr]));
      }));

      it('should start with a waiting observable if there are no addresses', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).not.toHaveBeenCalled();
      }));

      describe('case: contract.votingContracts(i) fails for some indices', () => {

        beforeEach(() => {
          abstraction.contract.setContractAddresses(DUMMY_ADDRESSES);
          spyOn(abstraction.contract.votingContracts, 'call').and.callFake(idx => {
            if (idx === 0 || idx === 3) {
              return Promise.resolve(DUMMY_ADDRESSES[idx]);
            } else {
              return Promise.reject(`Failed to retrieve contract ${idx}`);
            }
          });
        });

        it('should notify the Error Service for every unavailable contract', fakeAsync(() => {
          init_and_call_deployedVotes$();
          expect(errSvc.add).not.toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(0));
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(1));
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(2));
          expect(errSvc.add).not.toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(3));
        }));

        it('should start with the list of available contracts', fakeAsync(() => {
          init_and_call_deployedVotes$();
          expect(onNext.calls.allArgs()).toEqual(
            [DUMMY_ADDRESSES[0], null, null, DUMMY_ADDRESSES[3]].map(arg => [arg])
          );
        }));
      });
    });

    describe('case: VoteCreated events', () => {

      beforeEach(() => {
        abstraction.contract.setContractAddresses(DUMMY_ADDRESSES);
        onNext = jasmine.createSpy('onNext');
      });

      const init_and_check_inital_values = () => {
        init_and_call_deployedVotes$();
        expect(onNext.calls.allArgs()).toEqual(DUMMY_ADDRESSES.map(addr => [addr]));
      };

      const newLog = (idx) => ({
        event: VoteCreatedEvent.name,
        args: {
          contractAddress: `New address ${idx}`
        }
      });

      it('should emit a new event whenever the VoteListing contract emits a VoteCreated event', fakeAsync(() => {
        init_and_check_inital_values();
        abstraction.contract.eventStream.trigger(null, newLog(1));
        expect(onNext).toHaveBeenCalledTimes(DUMMY_ADDRESSES.length + 1);

        abstraction.contract.eventStream.trigger(null, newLog(2));
        expect(onNext).toHaveBeenCalledTimes(DUMMY_ADDRESSES.length + 2);
      }));

      it('should emit the address as the event', fakeAsync(() => {
        init_and_check_inital_values();
        abstraction.contract.eventStream.trigger(null, newLog(1));
        expect(onNext.calls.mostRecent().args[0]).toEqual(newLog(1).args.contractAddress);

        abstraction.contract.eventStream.trigger(null, newLog(2));
        expect(onNext.calls.mostRecent().args[0]).toEqual(newLog(2).args.contractAddress);
      }));

      describe('case: the event stream contains an error', () => {
        const streamError: Error = new Error('Error in event stream');

        it('should notify the Error Service if the contract event stream contains an error', fakeAsync(() => {
          init_and_check_inital_values();
          abstraction.contract.eventStream.trigger(streamError, null);
          expect(errSvc.add).toHaveBeenCalledWith(streamError);
        }));

        it('should not affect the deployedVotes$ stream', fakeAsync(() => {
          init_and_check_inital_values();
          abstraction.contract.eventStream.trigger(streamError, null);
          expect(onNext).toHaveBeenCalledTimes(DUMMY_ADDRESSES.length);
          expect(onCompleted).not.toHaveBeenCalled();
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
        init_and_check_inital_values();
        abstraction.contract.eventStream.trigger(null, otherEvent);
        expect(onNext).toHaveBeenCalledTimes(DUMMY_ADDRESSES.length);
        // onError and onCompleted will fail the test, so we don't need to check for them
      }));

      it('should handle interleaved VoteCreated and error events', fakeAsync(() => {
        const streamError: Error = new Error('Error in event stream');
        init_and_check_inital_values();

        let nEvents: number = DUMMY_ADDRESSES.length;
        let nErrors: number = 0;
        let lastEvent: address = DUMMY_ADDRESSES[DUMMY_ADDRESSES.length - 1];

        const checkExpectations = () => {
          expect(onNext.calls.mostRecent().args[0]).toEqual(lastEvent);
          expect(onNext).toHaveBeenCalledTimes(nEvents);
          expect(errSvc.add).toHaveBeenCalledTimes(nErrors);
        };

        const logEvent = () => {
          abstraction.contract.eventStream.trigger(null, newLog(nEvents));
          lastEvent = newLog(nEvents).args.contractAddress;
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

    describe('case: web3 is not injected', () => {
      beforeEach(() => spyOnProperty(web3Svc, 'isInjected').and.returnValue(false));

      it('should be an empty observable', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: VoteListing contract is not deployed', () => {
      beforeEach(() => spyOn(abstraction, 'deployed').and.returnValue(Promise.reject('Network fail')));

      it('should be an empty observable', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: contract.numberOfVotingContracts fails', () => {
      beforeEach(() => {
        spyOn(abstraction.contract.numberOfVotingContracts, 'call').and.returnValue(Promise.reject('call fail'));
      });

      it('should notify the Error Service that deployedVotes$ does not contain existing contracts', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.deployedVotes);
      }));

      it('should be an empty observable', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

  });
});

