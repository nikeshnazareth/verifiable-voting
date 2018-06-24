import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { ErrorService } from '../../error-service/error.service';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../../mock/module';
import { AnonymousVotingContractManager, AnonymousVotingContractManagerErrors } from './contract-manager';
import { AnonymousVotingAPI, RegistrationComplete, VoterInitiatedRegistration, VoteSubmitted } from './contract.api';
import Spy = jasmine.Spy;

describe('class: AnonymousVotingContractManager', () => {
  const contractManager = () => new AnonymousVotingContractManager(contract$, errSvc);
  let voteCollection: IAnonymousVotingContractCollection;
  let contract$: Observable<AnonymousVotingAPI>;
  let errSvc: ErrorService;

  const msPerDay: number = 1000 * 60 * 60 * 24;

  const onError = (err) => fail(err);
  let onNext: Spy;
  let onCompleted: Spy;

  const mostRecent = () => onNext.calls.mostRecent().args[0];

  beforeEach(() => {
    errSvc = new ErrorService();
    spyOn(errSvc, 'add').and.stub();

    voteCollection = Mock.AnonymousVotingContractCollections[0];
    contract$ = Observable.of(voteCollection.instance);

    onNext = jasmine.createSpy('onNext');
    onCompleted = jasmine.createSpy('onCompleted');
  });

  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(fakeAsync(() => {
    jasmine.clock().uninstall();
  }));

  describe('property: constants$', () => {
    const retrievalError = new Error('Value cannot be retrieved');
    const failedRetrievalObj = {
      call: () => Promise.reject(retrievalError)
    };

    const init_constant$_and_subscribe = () => {
      contractManager().constants$.subscribe(onNext, onError, onCompleted);
      tick();
    };

    const error_tests = () => {
      beforeEach(fakeAsync(() => init_constant$_and_subscribe()));

      it('should notify the Error Service', () => {
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractManagerErrors.constants, retrievalError);
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    };

    describe('case: the contract observable is empty', () => {

      beforeEach(fakeAsync(() => {
        contract$ = Observable.empty();
        init_constant$_and_subscribe();
      }));

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: parameters hash cannot be retrieved', () => {
      beforeEach(() => spyOnProperty(voteCollection.instance, 'parametersHash').and.returnValue(failedRetrievalObj));
      error_tests();
    });

    describe('case: eligibility contract cannot be retrieved', () => {
      beforeEach(() => spyOnProperty(voteCollection.instance, 'eligibilityContract').and.returnValue(failedRetrievalObj));
      error_tests();
    });

    describe('case: registration authority cannot be retrieved', () => {
      beforeEach(() => spyOnProperty(voteCollection.instance, 'registrationAuthority').and.returnValue(failedRetrievalObj));
      error_tests();
    });

    describe('case: registration deadline cannot be retrieved', () => {
      beforeEach(() => spyOnProperty(voteCollection.instance, 'registrationDeadline').and.returnValue(failedRetrievalObj));
      error_tests();
    });

    describe('case: voting deadline cannot be retrieved', () => {
      beforeEach(() => spyOnProperty(voteCollection.instance, 'votingDeadline').and.returnValue(failedRetrievalObj));
      error_tests();
    });
  });

  describe('property: phase$', () => {

    const init_phase$_and_subscribe = () => {
      contractManager().phase$.subscribe(onNext, onError, onCompleted);
      tick();
    };

    describe('case: constants$ is an empty observable', () => {

      beforeEach(fakeAsync(() => {
        contract$ = Observable.empty();
        init_phase$_and_subscribe();
      }));

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });


    describe('case: before the registration deadline', () => {
      beforeEach(() => jasmine.clock().mockDate(
        new Date(voteCollection.voteConstants.registrationDeadline - msPerDay)
      ));

      it('should start at phase 0', fakeAsync(() => {
        init_phase$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(0);
        discardPeriodicTasks();
      }));

      describe('case: the registration deadline expires', () => {
        beforeEach(fakeAsync(() => {
          init_phase$_and_subscribe();
          jasmine.clock().tick(2 * msPerDay);
          tick();
          discardPeriodicTasks();
        }));

        it('should emit the phase "1"', () => {
          expect(onNext).toHaveBeenCalledTimes(2);
          expect(mostRecent()).toEqual(1);
        });
      });

      describe('case: the voting deadline expires', () => {
        beforeEach(fakeAsync(() => {
          init_phase$_and_subscribe();
          jasmine.clock().tick(20 * msPerDay);
          tick();
          discardPeriodicTasks();
        }));

        it('should emit the phase "2"', () => {
          expect(onNext).toHaveBeenCalledTimes(3);
          expect(mostRecent()).toEqual(2);
        });

        it('should complete', () => {
          expect(onCompleted).toHaveBeenCalled();
        });
      });
    });

    describe('case: during the voting phase', () => {
      beforeEach(() => jasmine.clock().mockDate(
        new Date(voteCollection.voteConstants.registrationDeadline + msPerDay)
      ));

      it('should immediately emit phases "0" and "1"', fakeAsync(() => {
        init_phase$_and_subscribe();
        expect(onNext).toHaveBeenCalledTimes(2);
        expect(onNext).toHaveBeenCalledWith(0);
        expect(mostRecent()).toEqual(1);
        discardPeriodicTasks();
      }));

      describe('case: the voting deadline expires', () => {
        beforeEach(fakeAsync(() => {
          init_phase$_and_subscribe();
          jasmine.clock().tick(20 * msPerDay);
          tick();
          discardPeriodicTasks();
        }));

        it('should emit the phase "2"', () => {
          expect(onNext).toHaveBeenCalledTimes(3);
          expect(mostRecent()).toEqual(2);
        });

        it('should complete', () => {
          expect(onCompleted).toHaveBeenCalled();
        });
      });
    });

    describe('case: after the voting phase', () => {
      beforeEach(() => jasmine.clock().mockDate(new Date(voteCollection.voteConstants.votingDeadline + msPerDay)));

      beforeEach(fakeAsync(() => init_phase$_and_subscribe()));

      it('should immediately emit phases "0" and "1" amd "2"', () => {
        expect(onNext).toHaveBeenCalledTimes(3);
        expect(onNext).toHaveBeenCalledWith(0);
        expect(onNext).toHaveBeenCalledWith(1);
        expect(mostRecent()).toEqual(2);
      });

      it('should complete', () => {
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('property: registrationHashes$', () => {
    const init_registrationHashes$_and_subscribe = fakeAsync(() => {
      contractManager().registrationHashes$.subscribe(onNext, onError, onCompleted);
      tick();
    });

    const triggerVoterRegistrationEvent = (i) => {
      voteCollection.eventStream.trigger(null, {
        event: VoterInitiatedRegistration.name,
        args: {
          voter: Mock.Voters[i].public_address,
          blindedAddressHash: Mock.Voters[i].blinded_address_hash
        }
      });
    };

    const triggerRegistrationComplete = (i) => {
      voteCollection.eventStream.trigger(null, {
        event: RegistrationComplete.name,
        args: {
          voter: Mock.Voters[i].public_address,
          signatureHash: Mock.Voters[i].signed_blinded_address_hash
        }
      });
    };

    it('should start with an empty object', () => {
      init_registrationHashes$_and_subscribe();
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith({});
    });

    describe('case: a voter initiates registration', () => {
      beforeEach(() => {
        init_registrationHashes$_and_subscribe();
        triggerVoterRegistrationEvent(0);
      });

      it('should record the blinded address hash in the table', () => {
        expect(Object.keys(mostRecent()).length).toEqual(1);
        const record = mostRecent()[Mock.Voters[0].public_address];
        expect(record).toBeDefined();
        expect(record.blindedAddress).toEqual(Mock.Voters[0].blinded_address_hash);
        expect(record.signature).toBeNull();
      });

      describe('case: the registration authority completes the registration', () => {
        beforeEach(() => triggerRegistrationComplete(0));

        it('should record the blind signature in the same row of the table', () => {
          expect(Object.keys(mostRecent()).length).toEqual(1);
          const record = mostRecent()[Mock.Voters[0].public_address];
          expect(record).toBeDefined();
          expect(record.blindedAddress).toEqual(Mock.Voters[0].blinded_address_hash);
          expect(record.signature).toEqual(Mock.Voters[0].signed_blinded_address_hash);
        });
      });
    });

    describe('case: three voters in a row initiate registration', () => {
      beforeEach(() => {
        init_registrationHashes$_and_subscribe();
        triggerVoterRegistrationEvent(0);
        triggerVoterRegistrationEvent(1);
        triggerVoterRegistrationEvent(2);
      });

      it('should record the blinded address hash in the table', () => {
        expect(Object.keys(mostRecent()).length).toEqual(3);
        [0, 1, 2].map(idx => {
          const record = mostRecent()[Mock.Voters[idx].public_address];
          expect(record).toBeDefined();
          expect(record.blindedAddress).toEqual(Mock.Voters[idx].blinded_address_hash);
          expect(record.signature).toBeNull();
        });
      });

      describe('case: the registration authority completes the second registration', () => {
        beforeEach(() => triggerRegistrationComplete(1));

        it('should not affect the first record', () => {
          const record = mostRecent()[Mock.Voters[0].public_address];
          expect(record).toBeDefined();
          expect(record.blindedAddress).toEqual(Mock.Voters[0].blinded_address_hash);
          expect(record.signature).toBeNull();
        });

        it('should not affect the third record', () => {
          const record = mostRecent()[Mock.Voters[2].public_address];
          expect(record).toBeDefined();
          expect(record.blindedAddress).toEqual(Mock.Voters[2].blinded_address_hash);
          expect(record.signature).toBeNull();
        });

        it('should record the blind signature in the same row of the table', () => {
          expect(Object.keys(mostRecent()).length).toEqual(3);
          const record = mostRecent()[Mock.Voters[1].public_address];
          expect(record).toBeDefined();
          expect(record.blindedAddress).toEqual(Mock.Voters[1].blinded_address_hash);
          expect(record.signature).toEqual(Mock.Voters[1].signed_blinded_address_hash);
        });
      });
    });

    xdescribe('case: there is an error in the event stream', () => {
    });
  });

  describe('property: voteHashes$', () => {
    const init_voteHashes$_and_subscribe = fakeAsync(() => {
      contractManager().voteHashes$.subscribe(onNext, onError, onCompleted);
      tick();
    });

    const triggerVoteSubmittedEvent = (i) => {
      voteCollection.eventStream.trigger(null, {
        event: VoteSubmitted.name,
        args: {
          voter: Mock.Voters[i].anonymous_address,
          voteHash: Mock.Voters[i].vote_hash
        }
      });
    };

    it('should start with a waiting observable', () => {
      init_voteHashes$_and_subscribe();
      expect(onNext).not.toHaveBeenCalled();
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('should emit an item for every VoteSubmitted event', () => {
      init_voteHashes$_and_subscribe();
      Mock.Voters.map((voter, idx) => {
        triggerVoteSubmittedEvent(idx);
        expect(onNext).toHaveBeenCalledTimes(idx + 1);
        expect(onCompleted).not.toHaveBeenCalled();
      });
    });

    it('it should emit the voter and vote hash corresponding to the VoteSubmitted event', () => {
      init_voteHashes$_and_subscribe();
      Mock.Voters.map((voter, idx) => {
        triggerVoteSubmittedEvent(idx);
        expect(mostRecent().voter).toEqual(voter.anonymous_address);
        expect(mostRecent().voteHash).toEqual(voter.vote_hash);
      });
    });
  });

  describe('method: register$', () => {
    const voter: IVoter = Mock.Voters[0];

    const init_register$_and_subscribe = fakeAsync(() => {
      contractManager().register$(voter.public_address, voter.blinded_address_hash)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should call the "register" function on the AnonymousVoting contract', () => {
      spyOn(voteCollection.instance, 'register').and.callThrough();
      init_register$_and_subscribe();
      expect(voteCollection.instance.register).toHaveBeenCalled();
    });

    it('should pass the blinded address hash to the AnonymousVoting.register function', () => {
      spyOn(voteCollection.instance, 'register').and.callThrough();
      init_register$_and_subscribe();
      expect((<Spy>voteCollection.instance.register).calls.mostRecent().args[0]).toEqual(voter.blinded_address_hash);
    });

    it('should set the message sender on the AnonymousVoting.register call to the specified voter address', () => {
      spyOn(voteCollection.instance, 'register').and.callThrough();
      init_register$_and_subscribe();
      expect((<Spy>voteCollection.instance.register).calls.mostRecent().args[1]).toEqual({from: voter.public_address});
    });

    it('should return the contract register receipt and complete', () => {
      init_register$_and_subscribe();
      expect(onNext).toHaveBeenCalledWith(voter.register_receipt);
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: the contract observable is empty', () => {
      beforeEach(() => {
        contract$ = Observable.empty();
        init_register$_and_subscribe();
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.register fails', () => {
      const error: Error = new Error('Unable to register voter');

      beforeEach(() => spyOn(voteCollection.instance, 'register').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_register$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractManagerErrors.registration, error);
      });

      it('should return an empty observable', () => {
        init_register$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('method: voter$', () => {
    const voter: IVoter = Mock.Voters[0];

    const init_vote$_and_subscribe = fakeAsync(() => {
      contractManager().vote$(voter.anonymous_address, voter.vote_hash)
        .subscribe(onNext, onError, onCompleted);
      tick();
    });

    it('should call the "vote" function on the AnonymousVoting contract', () => {
      spyOn(voteCollection.instance, 'vote').and.callThrough();
      init_vote$_and_subscribe();
      expect(voteCollection.instance.vote).toHaveBeenCalled();
    });

    it('should pass the vote hash to the AnonymousVoting.vote function', () => {
      spyOn(voteCollection.instance, 'vote').and.callThrough();
      init_vote$_and_subscribe();
      expect((<Spy>voteCollection.instance.vote).calls.mostRecent().args[0]).toEqual(voter.vote_hash);
    });

    it('should set the message sender on the AnonymousVoting.vote call to the specified anonymous address', () => {
      spyOn(voteCollection.instance, 'vote').and.callThrough();
      init_vote$_and_subscribe();
      expect((<Spy>voteCollection.instance.vote).calls.mostRecent().args[1]).toEqual({from: voter.anonymous_address});
    });

    it('should return the contract register receipt and complete', () => {
      init_vote$_and_subscribe();
      expect(onNext).toHaveBeenCalledWith(voter.vote_receipt);
      expect(onCompleted).toHaveBeenCalled();
    });

    describe('case: the contract observable is empty', () => {
      beforeEach(() => {
        contract$ = Observable.empty();
        init_vote$_and_subscribe();
      });

      it('should return an empty observable', () => {
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });

    describe('case: contract.vote fails', () => {
      const error: Error = new Error('Unable to vote');

      beforeEach(() => spyOn(voteCollection.instance, 'vote').and.returnValue(Promise.reject(error)));

      it('should notify the Error Service', () => {
        init_vote$_and_subscribe();
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractManagerErrors.vote, error);
      });

      it('should return an empty observable', () => {
        init_vote$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});
