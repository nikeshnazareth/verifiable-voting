import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';

import { RegistrationPhaseComponent, RegistrationPhaseComponentMessages } from './registration-phase.component';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';

describe('Component: RegistrationPhaseComponent', () => {
  let fixture: ComponentFixture<RegistrationPhaseComponent>;
  let page: Page;

  class Page {
    public static ARBITRARY_CONTRACT_INDICES: number[] = [1, 2, 1, 0, 3];
    public static MS_PER_DAY: number = 1000 * 60 * 60 * 24;

    public voteRetrievalSvc: VoteRetrievalService;

    constructor() {
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
    }

    get registerSection(): DebugElement {
      return fixture.debugElement.query(By.css('#register'));
    }

    get unavailableSection(): DebugElement {
      return fixture.debugElement.query(By.css('#unavailable'));
    }
  }


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        RegistrationPhaseComponent
      ],
      imports: [
        MaterialModule,
      ],
      providers: [
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(RegistrationPhaseComponent);
        page = new Page();
      });
  }));

  describe('User Interface', () => {
    describe('component status', () => {
      const index = Page.ARBITRARY_CONTRACT_INDICES[0];
      const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[index];
      let voteDetails: IVotingContractDetails;

      beforeEach(() => {
        voteDetails = {
          index: index,
          address: voteCollection.address,
          phase: VotePhases[voteCollection.currentPhase],
          parameters: voteCollection.parameters,
          registrationDeadline: {
            status: RETRIEVAL_STATUS.AVAILABLE,
            value: new Date(voteCollection.timeframes.registrationDeadline)
          },
          votingDeadline: {
            status: RETRIEVAL_STATUS.AVAILABLE,
            value: new Date(voteCollection.timeframes.votingDeadline)
          }
        };
        spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(voteDetails));
      });

      describe(`case: phase = ${RETRIEVAL_STATUS.RETRIEVING}`, () => {
        beforeEach(() => {
          voteDetails.phase = RETRIEVAL_STATUS.RETRIEVING;
          fixture.detectChanges();
        });

        it('should remove the "register" section', () => {
          expect(page.registerSection).toEqual(null);
        });

        it('should create the "unavailable" section', () => {
          expect(page.unavailableSection).toBeTruthy();
        });

        it(`should display "${RegistrationPhaseComponentMessages.retrieving}"`, () => {
          expect(page.unavailableSection.nativeElement.innerText).toEqual(RegistrationPhaseComponentMessages.retrieving);
        });
      });

      describe(`case: phase = ${RETRIEVAL_STATUS.UNAVAILABLE}`, () => {
        beforeEach(() => {
          voteDetails.phase = RETRIEVAL_STATUS.UNAVAILABLE;
          fixture.detectChanges();
        });

        it('should remove the "register" section', () => {
          expect(page.registerSection).toEqual(null);
        });

        it('should create the "unavailable" section', () => {
          expect(page.unavailableSection).toBeTruthy();
        });

        it(`should display "${RegistrationPhaseComponentMessages.unavailable}"`, () => {
          expect(page.unavailableSection.nativeElement.innerText).toEqual(RegistrationPhaseComponentMessages.unavailable);
        });
      });

      describe('case: phase = "REGISTRATION"', () => {

        beforeEach(() => {
          voteDetails.phase = 'REGISTRATION';
        });

        describe('case: the registration deadline is being retrieved', () => {
          beforeEach(() => {
            voteDetails.registrationDeadline = {
              status: RETRIEVAL_STATUS.RETRIEVING,
              value: null
            };
            fixture.detectChanges();
          });

          it('should remove the "register" section', () => {
            expect(page.registerSection).toEqual(null);
          });

          it('should create the "unavailable" section', () => {
            expect(page.unavailableSection).toBeTruthy();
          });

          it(`should display "${RegistrationPhaseComponentMessages.retrieving}"`, () => {
            expect(page.unavailableSection.nativeElement.innerText)
              .toEqual(RegistrationPhaseComponentMessages.retrieving);
          });
        });

        describe('case: the registration deadline is unavailable', () => {
          beforeEach(() => {
            voteDetails.registrationDeadline = {
              status: RETRIEVAL_STATUS.UNAVAILABLE,
              value: null
            };
            fixture.detectChanges();
          });

          it('should remove the "register" section', () => {
            expect(page.registerSection).toEqual(null);
          });

          it('should create the "unavailable" section', () => {
            expect(page.unavailableSection).toBeTruthy();
          });

          it(`should display "${RegistrationPhaseComponentMessages.unavailable}"`, () => {
            expect(page.unavailableSection.nativeElement.innerText)
              .toEqual(RegistrationPhaseComponentMessages.unavailable);
          });
        });

        describe('case: the registration deadline is in the past', () => {
          beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate(new Date(voteDetails.registrationDeadline.value.getTime() + Page.MS_PER_DAY));
            fixture.detectChanges();
          });

          afterEach(() => {
            jasmine.clock().uninstall();
          });

          it('should remove the "register" section', () => {
            expect(page.registerSection).toEqual(null);
          });

          it('should create the "unavailable" section', () => {
            expect(page.unavailableSection).toBeTruthy();
          });

          it(`should display "${RegistrationPhaseComponentMessages.closed}"`, () => {
            expect(page.unavailableSection.nativeElement.innerText).toEqual(RegistrationPhaseComponentMessages.closed);
          });
        });

        describe('case: the registration deadline is in the future', () => {
          beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate(new Date(voteDetails.registrationDeadline.value.getTime() - Page.MS_PER_DAY));
            fixture.detectChanges();
          });

          afterEach(() => {
            jasmine.clock().uninstall();
          });

          it('should create the "register" section', () => {
            expect(page.registerSection).toBeTruthy();
          });

          it('should remove the "unavailable" section', () => {
            expect(page.unavailableSection).toEqual(null);
          });

          xdescribe('case: the deadline expires while the component is active', () => {
            it('should transition to a removed "register" section', () => {
              expect(page.registerSection).toBeTruthy();
              jasmine.clock().tick(2 * Page.MS_PER_DAY);
              expect(page.registerSection).toEqual(null);
            });

            it('should create the "unavailable" section', () => {
              expect(page.unavailableSection).toEqual(null);
              jasmine.clock().tick(2 * Page.MS_PER_DAY);
              expect(page.unavailableSection).toBeTruthy();
            });

            it(`should display ${RegistrationPhaseComponentMessages.closed}`, () => {
              jasmine.clock().tick(2 * Page.MS_PER_DAY);
              expect(page.unavailableSection.nativeElement.innerText).toEqual(RegistrationPhaseComponentMessages.closed);
            });
          });
        });
      });

      describe(`case: in ${VotePhases[1]} phase`, () => {
        beforeEach(() => {
          voteDetails.phase = VotePhases[1];
          fixture.detectChanges();
        });

        it('should remove the "register" section', () => {
          expect(page.registerSection).toEqual(null);
        });

        it('should create the "unavailable" section', () => {
          expect(page.unavailableSection).toBeTruthy();
        });

        it(`should display "${RegistrationPhaseComponentMessages.closed}"`, () => {
          expect(page.unavailableSection.nativeElement.innerText).toEqual(RegistrationPhaseComponentMessages.closed);
        });
      });

      describe(`case: in ${VotePhases[2]} phase`, () => {
        beforeEach(() => {
          voteDetails.phase = VotePhases[2];
          fixture.detectChanges();
        });

        it('should remove the "register" section', () => {
          expect(page.registerSection).toEqual(null);
        });

        it('should create the "unavailable" section', () => {
          expect(page.unavailableSection).toBeTruthy();
        });

        it(`should display "${RegistrationPhaseComponentMessages.closed}"`, () => {
          expect(page.unavailableSection.nativeElement.innerText).toEqual(RegistrationPhaseComponentMessages.closed);
        });
      });
    });
  });

  describe('Functionality', () => {

  });
});
