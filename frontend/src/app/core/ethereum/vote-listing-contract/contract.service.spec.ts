import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { VoteListingContractErrors, VoteListingContractService } from './contract.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { VoteCreatedEvent } from './contract.api';
import { ErrorService } from '../../error-service/error.service';
import { IAnonymousVotingContractCollection, Mock } from '../../../mock/module';
import { IContractLog } from '../contract.interface';
import { address } from '../type.mappings';
import { APP_CONFIG } from '../../../config';
import { BigNumber } from '../../../mock/bignumber';
import Spy = jasmine.Spy;

describe('Service: VoteListingContractService', () => {
  let voteListingContractSvc: VoteListingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteListingContractService,
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: TruffleContractWrapperService, useClass: Mock.TruffleVoteListingWrapperService},
      ]
    });

    voteListingContractSvc = TestBed.get(VoteListingContractService);
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
    spyOn(errSvc, 'add').and.stub();
  });

  describe('constructor', () => {
    it('should notify the Error Service if web3 is not injected', fakeAsync(() => {
      spyOnProperty(web3Svc, 'isInjected').and.returnValue(false);
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(APP_CONFIG.errors.web3, null);
    }));

    it('should notify the Error Service if the contract is not deployed', fakeAsync(() => {
      const deployError: Error = new Error('Network fail');
      spyOn(Mock.TruffleVoteListingAbstraction, 'deployed').and.returnValue(Promise.reject(deployError));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.network, deployError);
    }));
  });

  describe('method: deployVote', () => {
    const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];

    const init_and_call_deployVote = () => {
      voteListingContractSvc = new VoteListingContractService(web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote$(voteCollection.voteConstants)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should return an Observable that emits the transaction receipt and completes', fakeAsync(() => {
      init_and_call_deployVote();
      expect(onNext).toHaveBeenCalledWith(voteCollection.deploy_receipt);
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
      beforeEach(() =>
        spyOn(Mock.TruffleVoteListingAbstraction, 'deployed').and
          .returnValue(Promise.reject(new Error('VoteListing contract not deployed')))
      );

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: contract.deploy fails', () => {
      const deployError: Error = new Error('Deploy vote failed');

      beforeEach(() => spyOn(Mock.VoteListingContract, 'deploy').and
        .returnValue(Promise.reject(deployError)));

      it('should notify the Error Service that deployVote fails', fakeAsync(() => {
        init_and_call_deployVote();
        expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.deployVote, deployError);
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
      voteListingContractSvc = new VoteListingContractService(web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployedVotes$
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    describe('case: before VoteCreated events', () => {
      it('should emit the contract addresses', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext.calls.allArgs()).toEqual(Mock.addresses.map(addr => [addr]));
      }));

      it('should start with a waiting observable if there are no addresses', fakeAsync(() => {
        spyOn(Mock.VoteListingContract.numberOfVotingContracts, 'call').and
          .returnValue(Promise.resolve(new BigNumber(0)));
        init_and_call_deployedVotes$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).not.toHaveBeenCalled();
      }));

      describe('case: contract.votingContracts(i) fails for some indices', () => {

        beforeEach(() => {
          spyOn(Mock.VoteListingContract.votingContracts, 'call').and.callFake(idx => {
            if (idx === 0 || idx === 3) {
              return Promise.resolve(Mock.addresses[idx]);
            } else {
              return Promise.reject(new Error(`Failed to retrieve contract ${idx}`));
            }
          });
        });

        it('should notify the Error Service for every unavailable contract', fakeAsync(() => {
          init_and_call_deployedVotes$();
          expect(errSvc.add).not.toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(0), jasmine.any(Error));
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(1), jasmine.any(Error));
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(2), jasmine.any(Error));
          expect(errSvc.add).not.toHaveBeenCalledWith(VoteListingContractErrors.contractAddress(3), jasmine.any(Error));
        }));

        it('should start with the list of available contracts', fakeAsync(() => {
          init_and_call_deployedVotes$();
          expect(onNext.calls.allArgs()).toEqual(
            [Mock.addresses[0], null, null, Mock.addresses[3]].map(arg => [arg])
          );
        }));
      });
    });

    describe('case: after VoteCreated events', () => {
      let addresses: string[];

      beforeEach(() => {
        addresses = Mock.addresses.map(v => v);
        spyOnProperty(Mock, 'addresses').and.returnValue(addresses);
      });

      const init_and_check_inital_values = () => {
        init_and_call_deployedVotes$();
        expect(onNext.calls.allArgs()).toEqual(Mock.addresses.map(addr => [addr]));
      };

      const newLog = (idx) => ({
        event: VoteCreatedEvent.name,
        args: {
          contractAddress: `New address ${idx}`
        }
      });

      const triggerVoteCreatedEvent = (i) => {
        addresses.push(newLog(i).args.contractAddress);
        Mock.VoteCreatedEventStream.trigger(null, newLog(i));
        tick();
      };

      it('should emit a new event whenever the VoteListing contract emits a VoteCreated event', fakeAsync(() => {
        init_and_check_inital_values();
        const initialLength: number = Mock.addresses.length;

        triggerVoteCreatedEvent(1);
        expect(onNext).toHaveBeenCalledTimes(initialLength + 1);

        triggerVoteCreatedEvent(2);
        expect(onNext).toHaveBeenCalledTimes(initialLength + 2);
      }));

      it('should emit the address as the event', fakeAsync(() => {
        init_and_check_inital_values();

        triggerVoteCreatedEvent(1);
        expect(onNext.calls.mostRecent().args[0]).toEqual(newLog(1).args.contractAddress);

        triggerVoteCreatedEvent(2);
        expect(onNext.calls.mostRecent().args[0]).toEqual(newLog(2).args.contractAddress);
      }));

      describe('case: the event stream contains an error', () => {
        const streamError: Error = new Error('Error in event stream');

        it('should notify the Error Service if the contract event stream contains an error', fakeAsync(() => {
          init_and_check_inital_values();
          Mock.VoteCreatedEventStream.trigger(streamError, null);
          tick();
          expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.eventError, streamError);
        }));

        it('should not affect the deployedVotes$ stream', fakeAsync(() => {
          init_and_check_inital_values();
          Mock.VoteCreatedEventStream.trigger(streamError, null);
          tick();
          expect(onNext).toHaveBeenCalledTimes(Mock.addresses.length);
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
        Mock.VoteCreatedEventStream.trigger(null, otherEvent);
        tick();
        expect(onNext).toHaveBeenCalledTimes(Mock.addresses.length);
        expect(onCompleted).not.toHaveBeenCalled();
      }));

      it('should handle interleaved VoteCreated and error events', fakeAsync(() => {
        const streamError: Error = new Error('Error in event stream');
        init_and_check_inital_values();

        let nEvents: number = Mock.addresses.length;
        let nErrors: number = 0;
        let lastEvent: address = Mock.addresses[Mock.addresses.length - 1];

        const checkExpectations = () => {
          expect(onNext.calls.mostRecent().args[0]).toEqual(lastEvent);
          expect(onNext).toHaveBeenCalledTimes(nEvents);
          expect(errSvc.add).toHaveBeenCalledTimes(nErrors);
        };

        const logEvent = () => {
          triggerVoteCreatedEvent(nEvents);
          lastEvent = newLog(nEvents).args.contractAddress;
          nEvents++;
        };

        const errEvent = () => {
          Mock.VoteCreatedEventStream.trigger(streamError, null);
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
      beforeEach(() => spyOn(Mock.TruffleVoteListingAbstraction, 'deployed').and
        .returnValue(Promise.reject(new Error('Network fail'))));

      it('should be an empty observable', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: contract.numberOfVotingContracts fails', () => {
      const callError: Error = new Error('Call failed');

      beforeEach(() => {
        spyOn(Mock.VoteListingContract.numberOfVotingContracts, 'call').and
          .returnValue(Promise.reject(callError));
      });

      it('should notify the Error Service that deployedVotes$ does not contain existing contracts', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.deployedVotes, callError);
      }));

      it('should be an empty observable', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

  });
});
