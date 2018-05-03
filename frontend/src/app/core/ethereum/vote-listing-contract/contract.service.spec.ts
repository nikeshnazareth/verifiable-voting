import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { IVoteListingContractService, VoteListingContractErrors, VoteListingContractService } from './contract.service';
import { ITruffleContractWrapperService, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { IWeb3Service, Web3Service } from '../web3.service';
import { VoteCreatedEvent } from './contract.api';
import { ErrorService } from '../../error-service/error.service';
import { IAnonymousVotingContractCollection, Mock } from '../../../mock/module';
import { IContractLog } from '../contract.interface';
import { address } from '../type.mappings';
import { APP_CONFIG } from '../../../config';
import * as BigNumber from 'bignumber.js';
import Spy = jasmine.Spy;

describe('Service: VoteListingContractService', () => {
  let voteListingContractSvc: IVoteListingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractWrapperService;
  let errSvc: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteListingContractService,
        {provide: ErrorService, useClass: Mock.ErrorService},
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
      spyOn(Mock.TruffleVoteListingAbstraction, 'deployed').and.returnValue(Promise.reject('Network fail'));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      tick(); // wait for the promise to finish
      expect(errSvc.add).toHaveBeenCalledWith(VoteListingContractErrors.network);
    }));
  });

  describe('method: deployVote', () => {
    const VoteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];

    const init_and_call_deployVote = () => {
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc, errSvc);
      voteListingContractSvc.deployVote$(VoteCollection.params_hash)
        .subscribe(onNext, onError, onCompleted);
      tick();
    };

    it('should return an Observable that emits the transaction receipt and completes', fakeAsync(() => {
      init_and_call_deployVote();
      expect(onNext).toHaveBeenCalledWith(VoteCollection.deploy_receipt);
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
      beforeEach(() => spyOn(Mock.TruffleVoteListingAbstraction, 'deployed').and
        .returnValue(Promise.reject('Network fail')));

      it('should return an empty observable', fakeAsync(() => {
        init_and_call_deployVote();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: contract.deploy fails', () => {
      beforeEach(() => spyOn(Mock.VoteListingContract, 'deploy').and
        .returnValue(Promise.reject('Deploy vote failed')));

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
            [Mock.addresses[0], null, null, Mock.addresses[3]].map(arg => [arg])
          );
        }));
      });
    });

    describe('case: VoteCreated events', () => {

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

      it('should emit a new event whenever the VoteListing contract emits a VoteCreated event', fakeAsync(() => {
        init_and_check_inital_values();
        Mock.VoteCreatedEventStream.trigger(null, newLog(1));
        expect(onNext).toHaveBeenCalledTimes(Mock.addresses.length + 1);

        Mock.VoteCreatedEventStream.trigger(null, newLog(2));
        expect(onNext).toHaveBeenCalledTimes(Mock.addresses.length + 2);
      }));

      it('should emit the address as the event', fakeAsync(() => {
        init_and_check_inital_values();
        Mock.VoteCreatedEventStream.trigger(null, newLog(1));
        expect(onNext.calls.mostRecent().args[0]).toEqual(newLog(1).args.contractAddress);

        Mock.VoteCreatedEventStream.trigger(null, newLog(2));
        expect(onNext.calls.mostRecent().args[0]).toEqual(newLog(2).args.contractAddress);
      }));

      describe('case: the event stream contains an error', () => {
        const streamError: Error = new Error('Error in event stream');

        it('should notify the Error Service if the contract event stream contains an error', fakeAsync(() => {
          init_and_check_inital_values();
          Mock.VoteCreatedEventStream.trigger(streamError, null);
          expect(errSvc.add).toHaveBeenCalledWith(streamError);
        }));

        it('should not affect the deployedVotes$ stream', fakeAsync(() => {
          init_and_check_inital_values();
          Mock.VoteCreatedEventStream.trigger(streamError, null);
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
          Mock.VoteCreatedEventStream.trigger(null, newLog(nEvents));
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
        .returnValue(Promise.reject('Network fail')));

      it('should be an empty observable', fakeAsync(() => {
        init_and_call_deployedVotes$();
        expect(onNext).toHaveBeenCalledTimes(0);
        expect(onCompleted).toHaveBeenCalled();
      }));
    });

    describe('case: contract.numberOfVotingContracts fails', () => {
      beforeEach(() => {
        spyOn(Mock.VoteListingContract.numberOfVotingContracts, 'call').and
          .returnValue(Promise.reject('call fail'));
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

