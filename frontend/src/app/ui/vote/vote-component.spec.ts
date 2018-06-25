import { Component, DebugElement, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs/Observable';

import { IRSAKey } from '../../core/cryptography/rsa-key.interface';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { address } from '../../core/ethereum/type.mappings';
import {
  IRegistration,
  IVotingContractDetails,
  RETRIEVAL_STATUS
} from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { Mock } from '../../mock/module';
import { ICandidateTotal } from './results-component';
import { VoteComponent } from './vote-component';
import { VoteComponentMessages } from './vote-component-messages';

describe('Component: VoteComponent', () => {
  let fixture: ComponentFixture<VoteComponent>;
  let page: Page;

  class Page {
    public static ARBITRARY_CONTRACT_INDICES: number[] = [1, 2, 1, 0, 3];
    public voteRetrievalSvc: VoteRetrievalService;

    constructor() {
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
    }

    get container(): DebugElement {
      return fixture.debugElement.query(By.css('.container'));
    }

    get title(): DebugElement {
      return this.container.query(By.css('h2'));
    }

    get expansionPanels(): DebugElement[] {
      return this.container.queryAll(By.css('mat-expansion-panel'));
    }

    get panelDescriptions(): string[] {
      return this.expansionPanels
        .map(panel => panel.query(By.css('mat-panel-description')).nativeElement.innerHTML);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        VoteComponent,
        StubRegistrationPhaseComponent,
        StubVotingPhaseComponent,
        StubResultsComponent
      ],
      imports: [
        MaterialModule,
        BrowserAnimationsModule
      ],
      providers: [
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService},
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(VoteComponent);
        page = new Page();
      });
  }));

  const completeDetails = (idx) => {
    const collection = Mock.AnonymousVotingContractCollections[idx];
    return {
      index: idx,
      address: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.address},
      topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic},
      phase: {status: RETRIEVAL_STATUS.AVAILABLE, value: VotePhases[collection.currentPhase]},
      numPendingRegistrations: {status: RETRIEVAL_STATUS.AVAILABLE, value: 0},
      key: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.registration_key},
      candidates: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.candidates},
      registration: {status: RETRIEVAL_STATUS.AVAILABLE, value: {}},
      results: {status: RETRIEVAL_STATUS.AVAILABLE, value: []}
    };
  };


  describe('Structure', () => {
    describe('case: after vote is selected', () => {
      beforeEach(() => {
        fixture.componentInstance.index = 0;
        fixture.detectChanges();
      });

      it('should have a container element', () => {
        expect(page.container).toBeTruthy();
      });

      it('should have a title element', () => {
        expect(page.title).toBeTruthy();
      });

      describe('expansion panels', () => {
        let panel: DebugElement;

        it('should have three of them', () => {
          expect(page.expansionPanels.length).toEqual(3);
        });

        describe('first expansion panel', () => {
          beforeEach(() => {
            panel = page.expansionPanels[0];
          });

          it('should have a header', () => {
            expect(panel.query(By.css('mat-expansion-panel-header'))).toBeTruthy();
          });

          it('should have a title', () => {
            expect(panel.query(By.css('mat-panel-title'))).toBeTruthy();
          });

          it('should set the title contents to "REGISTER"', () => {
            expect(panel.query(By.css('mat-panel-title')).nativeElement.innerText.trim()).toEqual('REGISTER');
          });

          it('should have a description', () => {
            expect(panel.query(By.css('mat-panel-description'))).toBeTruthy();
          });

          it('should have a vv-registration-phase element', () => {
            expect(panel.query(By.css('vv-registration-phase'))).toBeTruthy();
          });
        });

        describe('second expansion panel', () => {
          beforeEach(() => {
            panel = page.expansionPanels[1];
          });

          it('should have a header', () => {
            expect(panel.query(By.css('mat-expansion-panel-header'))).toBeTruthy();
          });

          it('should have a title', () => {
            expect(panel.query(By.css('mat-panel-title'))).toBeTruthy();
          });

          it('should set the title contents to "VOTE"', () => {
            expect(panel.query(By.css('mat-panel-title')).nativeElement.innerText.trim()).toEqual('VOTE');
          });

          it('should have a description', () => {
            expect(panel.query(By.css('mat-panel-description'))).toBeTruthy();
          });

          it('should have a vv-voting-phase element', () => {
            expect(panel.query(By.css('vv-voting-phase'))).toBeTruthy();
          });
        });

        describe('third expansion panel', () => {
          beforeEach(() => {
            panel = page.expansionPanels[2];
          });

          it('should have a header', () => {
            expect(panel.query(By.css('mat-expansion-panel-header'))).toBeTruthy();
          });

          it('should have a title', () => {
            expect(panel.query(By.css('mat-panel-title'))).toBeTruthy();
          });

          it('should set the title contents to "RESULTS"', () => {
            expect(panel.query(By.css('mat-panel-title')).nativeElement.innerText.trim()).toEqual('RESULTS');
          });

          it('should have a description', () => {
            expect(panel.query(By.css('mat-panel-description'))).toBeTruthy();
          });

          it('should have a vv-results element', () => {
            expect(panel.query(By.css('vv-results'))).toBeTruthy();
          });
        });

      });
    });
  });

  describe('User Interface', () => {
    describe('container', () => {
      it('should not exist initially', () => {
        fixture.detectChanges();
        expect(page.container).toBeFalsy();
      });

      it('should be created when the index is set', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        expect(page.container).toBeTruthy();
      });

      it('should stay visible with subsequent changes to the index', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        fixture.componentInstance.index = 3;
        fixture.detectChanges();
        expect(page.container).toBeTruthy();
      });
    });

    describe('Title', () => {
      it('should have the format "[index]. [topic]"', () => {
        const idx: number = Page.ARBITRARY_CONTRACT_INDICES[0];
        const topic: string = Mock.AnonymousVotingContractCollections[idx].parameters.topic;
        fixture.componentInstance.index = idx;
        fixture.detectChanges();
        expect(page.title.nativeElement.innerText).toEqual(`${idx}. ${topic}`);
      });

      it('should update whenever index is changed', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          const topic: string = Mock.AnonymousVotingContractCollections[idx].parameters.topic;
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(page.title.nativeElement.innerText).toEqual(`${idx}. ${topic}`);
        });
      });
    });

    describe('Expansion Panels', () => {
      const idx: number = 0;
      beforeEach(() => {
        fixture.componentInstance.index = idx;
      });

      const availabilityTests = (name, property) => {
        describe(`case: the ${name} is being retrieved`, () => {
          beforeEach(() => {
            const details = completeDetails(idx);
            details[property] = {status: RETRIEVAL_STATUS.RETRIEVING, value: null};
            spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
            fixture.detectChanges();
          });

          it(`should state "${VoteComponentMessages.retrieving}" on all expansion panel descriptions`, () => {
            page.panelDescriptions.map(description => {
              expect(description).toEqual(VoteComponentMessages.retrieving);
            });
          });

          it('should disable all expansion panels', () => {
            page.expansionPanels.map(panel => expect(panel.componentInstance.disabled).toEqual(true));
          });
        });

        describe(`case: the ${name} is unavailable`, () => {
          beforeEach(() => {
            const details = completeDetails(idx);
            details[property] = {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null};
            spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
            fixture.detectChanges();
          });

          it(`should state "${VoteComponentMessages.unavailable}" on all expansion panel descriptions`, () => {
            page.panelDescriptions.map(description => {
              expect(description).toEqual(VoteComponentMessages.unavailable);
            });
          });

          it('should disable all expansion panels', () => {
            page.expansionPanels.map(panel => expect(panel.componentInstance.disabled).toEqual(true));
          });
        });
      };

      availabilityTests('phase', 'phase');
      availabilityTests('number of pending registrations', 'numPendingRegistrations');
      availabilityTests('contract address', 'address');
      availabilityTests('registration key', 'key');
      availabilityTests('candidates list', 'candidates');
      availabilityTests('registration', 'registration');
      availabilityTests('results', 'results');

      describe('case: all parameters are available', () => {

        describe('parameter: phase', () => {
          describe(`case: it is "${VotePhases[0]}"`, () => {
            let details: IVotingContractDetails;

            beforeEach(() => {
              details = completeDetails(idx);
              details.phase = {status: RETRIEVAL_STATUS.AVAILABLE, value: VotePhases[0]};
            });

            describe('section: first (Registration) expansion panel', () => {
              beforeEach(() => {
                spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                fixture.detectChanges();
              });

              it('should have an empty description', () => {
                expect(page.panelDescriptions[0]).toEqual('');
              });

              it('should be enabled', () => {
                expect(page.expansionPanels[0].componentInstance.disabled).toEqual(false);
              });
            });

            describe('section: second (Voting) expansion panel', () => {
              describe('case: there are no pending registrations', () => {
                beforeEach(() => {
                  spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                  fixture.detectChanges();
                });

                it(`should state ${VoteComponentMessages.votingNotOpened} on the expansion panel description`, () => {
                  expect(page.panelDescriptions[1]).toEqual(VoteComponentMessages.votingNotOpened);
                });

                it('should be disabled', () => {
                  expect(page.expansionPanels[1].componentInstance.disabled).toEqual(true);
                });
              });

              describe('case: there are pending registrations', () => {
                const numPending = 3;

                beforeEach(() => {
                  details.numPendingRegistrations.value = numPending;
                  spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                  fixture.detectChanges();
                });

                it(`should state ${VoteComponentMessages.votingNotOpened} on the expansion panel description`, () => {
                  expect(page.panelDescriptions[1]).toEqual(VoteComponentMessages.votingNotOpened);
                });

                it('should be disabled', () => {
                  expect(page.expansionPanels[1].componentInstance.disabled).toEqual(true);
                });
              });
            });

            describe('section: third (Results) expansion panel', () => {
              beforeEach(() => {
                spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                fixture.detectChanges();
              });

              it(`should state ${VoteComponentMessages.resultsNotFinalised} on the expansion panel description`, () => {
                expect(page.panelDescriptions[2]).toEqual(VoteComponentMessages.resultsNotFinalised);
              });

              it('should be enabled', () => {
                expect(page.expansionPanels[2].componentInstance.disabled).toEqual(false);
              });
            });
          });

          describe(`case: it is "${VotePhases[1]}"`, () => {
            let details: IVotingContractDetails;

            beforeEach(() => {
              details = completeDetails(idx);
              details.phase = {status: RETRIEVAL_STATUS.AVAILABLE, value: VotePhases[1]};
            });

            describe('section: first (Registration) expansion panel', () => {
              beforeEach(() => {
                spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                fixture.detectChanges();
              });

              it(`should state ${VoteComponentMessages.registrationClosed} on the expansion panel description`, () => {
                expect(page.panelDescriptions[0]).toEqual(VoteComponentMessages.registrationClosed);
              });

              it('should be disabled', () => {
                expect(page.expansionPanels[0].componentInstance.disabled).toEqual(true);
              });
            });

            describe('section: second (Voting) expansion panel', () => {
              describe('case: there are no pending registrations', () => {
                beforeEach(() => {
                  spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                  fixture.detectChanges();
                });

                it(`should have an empty description`, () => {
                  expect(page.panelDescriptions[1]).toEqual('');
                });

                it('should be enabled', () => {
                  expect(page.expansionPanels[1].componentInstance.disabled).toEqual(false);
                });
              });

              describe('case: there are pending registrations', () => {
                const numPending = 3;

                beforeEach(() => {
                  details.numPendingRegistrations.value = numPending;
                  spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                  fixture.detectChanges();
                });

                it(`should state ${VoteComponentMessages.pendingRegistrations(3)} on the expansion panel description`, () => {
                  expect(page.panelDescriptions[1]).toEqual(VoteComponentMessages.pendingRegistrations(3));
                });

                it('should be disabled', () => {
                  expect(page.expansionPanels[1].componentInstance.disabled).toEqual(true);
                });
              });
            });

            describe('section: third (Results) expansion panel', () => {
              beforeEach(() => {
                spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                fixture.detectChanges();
              });

              it(`should state ${VoteComponentMessages.resultsNotFinalised} on the expansion panel description`, () => {
                expect(page.panelDescriptions[2]).toEqual(VoteComponentMessages.resultsNotFinalised);
              });

              it('should be enabled', () => {
                expect(page.expansionPanels[2].componentInstance.disabled).toEqual(false);
              });
            });
          });

          describe(`case: it is "${VotePhases[2]}"`, () => {
            let details: IVotingContractDetails;

            beforeEach(() => {
              details = completeDetails(idx);
              details.phase = {status: RETRIEVAL_STATUS.AVAILABLE, value: VotePhases[2]};
            });

            describe('section: first (Registration) expansion panel', () => {
              beforeEach(() => {
                spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                fixture.detectChanges();
              });

              it(`should state ${VoteComponentMessages.registrationClosed} on the expansion panel description`, () => {
                expect(page.panelDescriptions[0]).toEqual(VoteComponentMessages.registrationClosed);
              });

              it('should be disabled', () => {
                expect(page.expansionPanels[0].componentInstance.disabled).toEqual(true);
              });
            });

            describe('section: second (Voting) expansion panel', () => {
              describe('case: there are no pending registrations', () => {
                beforeEach(() => {
                  spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                  fixture.detectChanges();
                });

                it(`should state ${VoteComponentMessages.votingClosed} on the expansion panel description`, () => {
                  expect(page.panelDescriptions[1]).toEqual(VoteComponentMessages.votingClosed);
                });

                it('should be disabled', () => {
                  expect(page.expansionPanels[1].componentInstance.disabled).toEqual(true);
                });
              });

              describe('case: there are pending registrations', () => {
                const numPending = 3;

                beforeEach(() => {
                  details.numPendingRegistrations.value = numPending;
                  spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                  fixture.detectChanges();
                });

                it(`should state ${VoteComponentMessages.votingClosed} on the expansion panel description`, () => {
                  expect(page.panelDescriptions[1]).toEqual(VoteComponentMessages.votingClosed);
                });

                it('should be disabled', () => {
                  expect(page.expansionPanels[1].componentInstance.disabled).toEqual(true);
                });
              });
            });

            describe('section: third (Results) expansion panel', () => {
              beforeEach(() => {
                spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(details));
                fixture.detectChanges();
              });

              it('should have an empty description', () => {
                expect(page.panelDescriptions[2]).toEqual('');
              });

              it('should be enabled', () => {
                expect(page.expansionPanels[2].componentInstance.disabled).toEqual(false);
              });
            });
          });
        });
      });
    });

    describe('Sub components', () => {


      describe('Registration Phase Component', () => {
        const regPhaseComponent = () => fixture.debugElement.query(By.css('vv-registration-phase'));

        describe('input: contract', () => {
          it('should be set to the VoteComponent contract address', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(regPhaseComponent().componentInstance.contract).toEqual(Mock.addresses[0]);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(regPhaseComponent().componentInstance.contract).toEqual(Mock.addresses[idx]);
            });
          });
        });

        describe('input: key', () => {
          it('should be set to the registration key', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(regPhaseComponent().componentInstance.key)
              .toEqual(Mock.AnonymousVotingContractCollections[0].parameters.registration_key);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(regPhaseComponent().componentInstance.key)
                .toEqual(Mock.AnonymousVotingContractCollections[idx].parameters.registration_key);
            });
          });
        });
      });

      describe('Voting Phase Component', () => {
        const votingPhaseComponent = () => fixture.debugElement.query(By.css('vv-voting-phase'));

        describe('input: contract', () => {
          it('should be set to the VoteComponent contract address', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(votingPhaseComponent().componentInstance.contract).toEqual(Mock.addresses[0]);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(votingPhaseComponent().componentInstance.contract).toEqual(Mock.addresses[idx]);
            });
          });
        });

        describe('input: key', () => {
          it('should be set to the registration key', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(votingPhaseComponent().componentInstance.key)
              .toEqual(Mock.AnonymousVotingContractCollections[0].parameters.registration_key);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(votingPhaseComponent().componentInstance.key)
                .toEqual(Mock.AnonymousVotingContractCollections[idx].parameters.registration_key);
            });
          });
        });

        describe('input: candidates', () => {
          it('should be set to the candidates list', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(votingPhaseComponent().componentInstance.candidates)
              .toEqual(Mock.AnonymousVotingContractCollections[0].parameters.candidates);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(votingPhaseComponent().componentInstance.candidates)
                .toEqual(Mock.AnonymousVotingContractCollections[idx].parameters.candidates);
            });
          });
        });

        describe('input: registration', () => {
          let mockRegistration;

          beforeEach(() => {
            mockRegistration = Mock.addresses.map(addr => ({arbitrary: 'MOCK REGISTRATION ' + addr}));
            spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.callFake((idx) => {
              const details = completeDetails(idx);
              details.registration.value = mockRegistration[idx];
              return Observable.of(details);
            });
          });

          it('should be a mapping from public voter addresses to blind signatures', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(votingPhaseComponent().componentInstance.registration).toEqual(mockRegistration[0]);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(votingPhaseComponent().componentInstance.registration).toEqual(mockRegistration[idx]);
            });
          });
        });
      });

      describe('Results Component', () => {
        const resultsComponent = () => fixture.debugElement.query(By.css('vv-results'));

        describe('input: results', () => {
          let mockResults;

          beforeEach(() => {
            mockResults = Mock.AnonymousVotingContractCollections.map((collection, colIdx) => {
              const N = collection.parameters.candidates.length;
              return collection.parameters.candidates.map((candidate, candIdx) => (colIdx + candIdx) * 5 % N);
            });
            spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.callFake((idx) => {
              const details = completeDetails(idx);
              details.results.value = mockResults[idx];
              return Observable.of(details);
            });
          });

          it('should be a histogram of the votes', () => {
            fixture.componentInstance.index = 0;
            fixture.detectChanges();
            expect(resultsComponent().componentInstance.tally).toEqual(mockResults[0]);
          });

          it('should track the index of the Vote Component', () => {
            Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
              fixture.componentInstance.index = idx;
              fixture.detectChanges();
              expect(resultsComponent().componentInstance.tally).toEqual(mockResults[idx]);
            });
          });
        });
      });
    });
  });
});

@Component({
  selector: 'vv-registration-phase',
  template: ''
})
class StubRegistrationPhaseComponent {
  @Input() contract: address;
  @Input() key: IRSAKey;
}

@Component({
  selector: 'vv-voting-phase',
  template: ''
})
class StubVotingPhaseComponent {
  @Input() contract: address;
  @Input() key: IRSAKey;
  @Input() candidates: string[];
  @Input() registration: IRegistration;
}

@Component({
  selector: 'vv-results',
  template: ''
})
class StubResultsComponent {
  @Input() tally: ICandidateTotal[];
}


