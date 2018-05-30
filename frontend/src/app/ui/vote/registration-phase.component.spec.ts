import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, OnInit } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { RegistrationPhaseComponent, RegistrationPhaseComponentMessages } from './registration-phase.component';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { address } from '../../core/ethereum/type.mappings';
import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { ErrorService } from '../../core/error-service/error.service';

fdescribe('Component: RegistrationPhaseComponent', () => {
  let fixture: ComponentFixture<TestRegistrationPhaseComponent>;
  let page: Page;

  class Page {
    public static ARBITRARY_CONTRACT_INDICES: number[] = [1, 2, 1, 0, 3];
    public static MS_PER_DAY: number = 1000 * 60 * 60 * 24;

    public voteRetrievalSvc: VoteRetrievalService;
    public errSvc: ErrorService;
    public web3Svc: Web3Service;

    constructor() {
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
      this.web3Svc = fixture.debugElement.injector.get(Web3Service);
      this.errSvc = fixture.debugElement.injector.get(ErrorService);
    }

    // use getters because the components are added/removed from the DOM

    get registerSection(): DebugElement {
      return fixture.debugElement.query(By.css('#register'));
    }

    get unavailableSection(): DebugElement {
      return fixture.debugElement.query(By.css('#unavailable'));
    }

    get voterAddressInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="voterAddress"]'));
    }

    get voterAddressButton(): DebugElement {
      return fixture.debugElement.query(By.css('button#fillVoterAddress'));
    }
  }


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestRegistrationPhaseComponent
      ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
      ],
      providers: [
        ErrorService,
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService},
        {provide: Web3Service, useClass: Mock.Web3Service}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TestRegistrationPhaseComponent);
        page = new Page();
      });
  }));

  fdescribe('User Interface', () => {

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
      spyOn(page.errSvc, 'add').and.stub();
    });

    describe('component status', () => {
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

    fdescribe('Voter Address', () => {
      beforeEach(() => fixture.detectChanges());

      describe('input box', () => {
        it('should exist', () => {
          expect(page.voterAddressInput).not.toBeNull();
        });

        it('should start empty', () => {
          expect(page.voterAddressInput.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Public Address"', () => {
          expect(page.voterAddressInput.nativeElement.placeholder).toEqual('Public Address');
        });

        it('should be a form control', () => {
          expect(page.voterAddressInput.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;
          const valid_address: address = '1234567890aabbccddee1234567890aabbccddee';

          beforeEach(() => {
            ctrl = fixture.componentInstance.form.get(page.voterAddressInput.attributes.formControlName);
          });

          it('should be invalid when null', () => {
            DOMInteractionUtility.setValueOn(page.voterAddressInput, '');
            fixture.detectChanges();
            expect(page.voterAddressInput.nativeElement.value).toBeFalsy();
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when containing exactly 40 hex characters', () => {
            DOMInteractionUtility.setValueOn(page.voterAddressInput, valid_address);
            fixture.detectChanges();
            expect(ctrl.valid).toEqual(true);
          });

          xit('should reuse the validator (and tests) from the LaunchVoteComponent -> registration authority address');
        });
      });

      describe('button', () => {
        it('should exist', () => {
          expect(page.voterAddressButton).not.toBeNull();
        });

        it('should have type "button"', () => {
          expect(page.voterAddressButton.nativeElement.type).toEqual('button');
        });

        it('should have text "Use Active Account"', () => {
          expect(page.voterAddressButton.nativeElement.innerText).toEqual('Use Active Account');
        });

        it('should fill the Voter Address input box with the current web3 active account', () => {
          expect(page.voterAddressInput.nativeElement.value).toBeFalsy();
          DOMInteractionUtility.clickOn(page.voterAddressButton);
          expect(page.voterAddressInput.nativeElement.value).toEqual(page.web3Svc.defaultAccount.slice(2));
        });

        it('should raise an error with the Error Service if the default account is undefined', () => {
          spyOnProperty(page.web3Svc, 'defaultAccount').and.returnValue(undefined);
          DOMInteractionUtility.clickOn(page.voterAddressButton);
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3ServiceErrors.account, null);
        });
      });
    });
  });

  describe('Functionality', () => {

  });
});

/**
 * Class to expose protected values for testing purposes
 * It is more correct to confirm the functionality using only public values
 * but testing form validation is a lot easier if we can see the validators directly
 * (instead of testing their effects, which cannot be isolated,
 *  since the relevant effects are synthesised across many components )
 */
export class TestRegistrationPhaseComponent extends RegistrationPhaseComponent implements OnInit {
  public form: FormGroup;

  ngOnInit() {
    super.ngOnInit();
    this.form = this.registerForm;
  }
}
