import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../../mock/module';
import { ErrorService } from '../../error-service/error.service';
import { AnonymousVotingContractErrors } from './contract-errors';
import Spy = jasmine.Spy;
import { RegistrationComplete, VoterInitiatedRegistration, VoteSubmitted } from './contract-events.interface';
import { AnonymousVotingContractManager } from './contract-manager';
import { AnonymousVotingAPI } from './contract.api';

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
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.constants, retrievalError);
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
    // note: this has ms resolution ( in contrast to the Ethereum block timestamp which has second resolution )
    let now: Date;

    const init_phase$_and_subscribe = () => {
      jasmine.clock().mockDate(now);
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
      beforeEach(() => {
        now = new Date(voteCollection.voteConstants.registrationDeadline * 1000 - msPerDay);
      });

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
      beforeEach(() => {
        now = new Date(voteCollection.voteConstants.registrationDeadline * 1000 + msPerDay);
      });

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
      beforeEach(() => {
        now = new Date(voteCollection.voteConstants.votingDeadline * 1000 + msPerDay);
      });

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
    let voterRegSpies;

    const init_registrationHashes$_and_subscribe = fakeAsync(() => {
      voterRegSpies = [];
      contractManager().registrationHashes$
        .map((obs, i) => {
          const spies = {
            onNext: jasmine.createSpy(`onNext Voter Reg ${i}`),
            onCompleted: jasmine.createSpy(`onCompleted Voter Reg ${i}`)
          };
          voterRegSpies.push(spies);
          obs.subscribe(spies.onNext, onError, spies.onCompleted);
          return null;
        })
        .subscribe(onNext, onError, onCompleted);
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

    it('should start with an waiting observable', () => {
      init_registrationHashes$_and_subscribe();
      expect(onNext).toHaveBeenCalledTimes(0);
      expect(onCompleted).not.toHaveBeenCalled();
    });

    describe('case: a voter initiates registration', () => {
      beforeEach(() => {
        init_registrationHashes$_and_subscribe();
        triggerVoterRegistrationEvent(0);
      });

      it('should emit a new observable for the voter', () => {
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(voterRegSpies.length).toEqual(1);
      });

      describe('the voter observable', () => {
        it('should emit a partial voter registration', () => {
          expect(voterRegSpies[0].onNext).toHaveBeenCalledTimes(1);
          const partialReg = voterRegSpies[0].onNext.calls.mostRecent().args[0];
          expect(partialReg).toBeDefined();
          expect(partialReg.voter).toEqual(Mock.Voters[0].public_address);
          expect(partialReg.blindedAddressHash).toEqual(Mock.Voters[0].blinded_address_hash);
          expect(partialReg.blindSignatureHash).toBeNull();
        });

        it('should be waiting for the voter completion', () => {
          expect(voterRegSpies[0].onCompleted).not.toHaveBeenCalled();
        });
      });

      describe('case: the registration authority completes the registration', () => {
        beforeEach(() => triggerRegistrationComplete(0));

        it('should not emit a new observable', () => {
          expect(onNext).toHaveBeenCalledTimes(1);
        });

        describe('the voter observable', () => {
          it('should emit the completed voter registration', () => {
            expect(voterRegSpies[0].onNext).toHaveBeenCalledTimes(2);
            const completeReg = voterRegSpies[0].onNext.calls.mostRecent().args[0];
            expect(completeReg).toBeDefined();
            expect(completeReg.voter).toEqual(Mock.Voters[0].public_address);
            expect(completeReg.blindedAddressHash).toEqual(Mock.Voters[0].blinded_address_hash);
            expect(completeReg.blindSignatureHash).toEqual(Mock.Voters[0].signed_blinded_address_hash);
          });

          it('should be completed', () => {
            expect(voterRegSpies[0].onCompleted).toHaveBeenCalled();
          });
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

      it('should emit a new observable per voter', () => {
        expect(onNext).toHaveBeenCalledTimes(3);
        expect(voterRegSpies.length).toEqual(3);
      });

      [0, 1, 2].map(voterIdx => {
        describe(`the voter observable ${voterIdx}`, () => {
          it('should emit a partial voter registration', () => {
            expect(voterRegSpies[voterIdx].onNext).toHaveBeenCalledTimes(1);
            const partialReg = voterRegSpies[voterIdx].onNext.calls.mostRecent().args[0];
            expect(partialReg).toBeDefined();
            expect(partialReg.voter).toEqual(Mock.Voters[voterIdx].public_address);
            expect(partialReg.blindedAddressHash).toEqual(Mock.Voters[voterIdx].blinded_address_hash);
            expect(partialReg.blindSignatureHash).toBeNull();
          });

          it('should be waiting for the voter completion', () => {
            expect(voterRegSpies[voterIdx].onCompleted).not.toHaveBeenCalled();
          });
        });
      });

      describe('case: the registration authority completes the second registration', () => {
        beforeEach(() => triggerRegistrationComplete(1));

        [0, 2].map(voterIdx => {
          describe(`the voter observable ${voterIdx}`, () => {
            it('should not be affected', () => {
              expect(voterRegSpies[voterIdx].onNext).toHaveBeenCalledTimes(1);
              expect(voterRegSpies[voterIdx].onCompleted).not.toHaveBeenCalled();
            });
          });
        });

        describe('the voter observable 1', () => {
          it('should emit the completed voter registration', () => {
            expect(voterRegSpies[1].onNext).toHaveBeenCalledTimes(2);
            const completeReg = voterRegSpies[1].onNext.calls.mostRecent().args[0];
            expect(completeReg).toBeDefined();
            expect(completeReg.voter).toEqual(Mock.Voters[1].public_address);
            expect(completeReg.blindedAddressHash).toEqual(Mock.Voters[1].blinded_address_hash);
            expect(completeReg.blindSignatureHash).toEqual(Mock.Voters[1].signed_blinded_address_hash);
          });

          it('should be completed', () => {
            expect(voterRegSpies[1].onCompleted).toHaveBeenCalled();
          });
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
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.registration, error);
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
        expect(errSvc.add).toHaveBeenCalledWith(AnonymousVotingContractErrors.vote, error);
      });

      it('should return an empty observable', () => {
        init_vote$_and_subscribe();
        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).toHaveBeenCalled();
      });
    });
  });
});
