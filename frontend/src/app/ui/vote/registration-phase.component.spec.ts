import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, OnInit } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { RegistrationPhaseComponent, RegistrationStatusMessages } from './registration-phase.component';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../mock/module';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { address } from '../../core/ethereum/type.mappings';
import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { ErrorService } from '../../core/error-service/error.service';
import { CryptographyService } from '../../core/cryptography/cryptography.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';

describe('Component: RegistrationPhaseComponent', () => {
  let fixture: ComponentFixture<TestRegistrationPhaseComponent>;
  let page: Page;

  const voteIndex = 1; // a contract in the registration phase
  const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[voteIndex];
  const voter: IVoter = Mock.Voters[0];
  let voteDetails: IVotingContractDetails;

  class Page {
    public static MS_PER_DAY: number = 1000 * 60 * 60 * 24;

    public voteRetrievalSvc: VoteRetrievalService;
    public errSvc: ErrorService;
    public web3Svc: Web3Service;
    public cryptoSvc: CryptographyService;
    public voteManagerSvc: VoteManagerService;

    constructor() {
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
      this.web3Svc = fixture.debugElement.injector.get(Web3Service);
      this.errSvc = fixture.debugElement.injector.get(ErrorService);
      this.cryptoSvc = fixture.debugElement.injector.get(CryptographyService);
      this.voteManagerSvc = fixture.debugElement.injector.get(VoteManagerService);
    }

    // use getters because the components are added/removed from the DOM

    static get form(): FormGroup {
      return fixture.componentInstance.form;
    }

    static get registerSection(): DebugElement {
      return fixture.debugElement.query(By.css('#register'));
    }

    static get unavailableSection(): DebugElement {
      return fixture.debugElement.query(By.css('#unavailable'));
    }

    static get voterAddressInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="voterAddress"]'));
    }

    static get voterAddressButton(): DebugElement {
      return fixture.debugElement.query(By.css('button#fillVoterAddress'));
    }

    static get voterAddressAcknowledgement(): DebugElement {
      return fixture.debugElement.query(By.css('mat-checkbox[formControlName="voterAddressAck"]'));
    }

    static get anonymousAddressInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="anonymousAddress"]'));
    }

    static get anonymousAddressButton(): DebugElement {
      return fixture.debugElement.query(By.css('button#fillAnonymousAddress'));
    }

    static get anonymousAddressAcknowledgement(): DebugElement {
      return fixture.debugElement.query(By.css('mat-checkbox[formControlName="anonymousAddressAck"]'));
    }

    static get blindingFactorInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="blindingFactor"]'));
    }

    static get blindingFactorButton(): DebugElement {
      return fixture.debugElement.query(By.css('button#refreshBlindingFactor'));
    }

    static get blindingFactorSaveAcknowledgement(): DebugElement {
      return fixture.debugElement.query(By.css('mat-checkbox[formControlName="blindingFactorSaveAck"]'));
    }

    static get blindingFactorProtectAcknowledgement(): DebugElement {
      return fixture.debugElement.query(By.css('mat-checkbox[formControlName="blindingFactorProtectAck"]'));
    }

    static get submitButtons(): DebugElement[] {
      return fixture.debugElement.queryAll(By.css('button[type="submit"]'));
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
        {provide: CryptographyService, useClass: Mock.CryptographyService},
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService},
        {provide: VoteManagerService, useClass: Mock.VoteManagerService},
        {provide: Web3Service, useClass: Mock.Web3Service}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TestRegistrationPhaseComponent);
        page = new Page();
      });
  }));

  beforeEach(() => {
    // put us in the vote registration phase
    voteDetails = {
      index: voteIndex,
      address: voteCollection.address,
      phase: VotePhases[voteCollection.currentPhase],
      parameters: {
        topic: voteCollection.parameters.topic,
        registration_key: {
          modulus: voteCollection.parameters.registration_key.modulus,
          public_exp: voteCollection.parameters.registration_key.public_exp
        },
        candidates: voteCollection.parameters.candidates.map(v => v)
      },
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

  describe('User Interface', () => {
    describe('component status', () => {
      const errorSectionTests = () => {
        it('should remove the "register" section', () => {
          expect(Page.registerSection).toEqual(null);
        });

        it('should create the "unavailable" section', () => {
          expect(Page.unavailableSection).toBeTruthy();
        });
      };

      const retrievingTests = () => {
        beforeEach(() => fixture.detectChanges());
        errorSectionTests();

        it(`should display "${RegistrationStatusMessages.retrieving}"`, () => {
          expect(Page.unavailableSection.nativeElement.innerText)
            .toEqual(RegistrationStatusMessages.retrieving);
        });
      };

      const unavailableTests = () => {
        beforeEach(() => fixture.detectChanges());
        errorSectionTests();

        it(`should display "${RegistrationStatusMessages.unavailable}"`, () => {
          expect(Page.unavailableSection.nativeElement.innerText).toEqual(RegistrationStatusMessages.unavailable);
        });
      };

      const registrationClosedTests = () => {
        beforeEach(() => fixture.detectChanges());
        errorSectionTests();

        it(`should display "${RegistrationStatusMessages.closed}"`, () => {
          expect(Page.unavailableSection.nativeElement.innerText).toEqual(RegistrationStatusMessages.closed);
        });
      };

      describe('case: the phase is being retrieved', () => {
        beforeEach(() => {
          voteDetails.phase = RETRIEVAL_STATUS.RETRIEVING;
        });
        retrievingTests();
      });

      describe('case: the registration deadline is being retrieved', () => {
        beforeEach(() => {
          voteDetails.registrationDeadline = {
            status: RETRIEVAL_STATUS.RETRIEVING,
            value: null
          };
        });
        retrievingTests();
      });

      describe('case: the contract address is being retrieved', () => {
        beforeEach(() => {
          voteDetails.address = RETRIEVAL_STATUS.RETRIEVING;
        });
        retrievingTests();
      });

      describe('case: the registration key modulus is being retrieving', () => {
        beforeEach(() => {
          voteDetails.parameters.registration_key.modulus = RETRIEVAL_STATUS.RETRIEVING;
        });
        retrievingTests();
      });

      describe('case: the registration key public exponent is being retrieved', () => {
        beforeEach(() => {
          voteDetails.parameters.registration_key.public_exp = RETRIEVAL_STATUS.RETRIEVING;
        });
        retrievingTests();
      });

      describe('case: the phase is unavailable', () => {
        beforeEach(() => {
          voteDetails.phase = RETRIEVAL_STATUS.UNAVAILABLE;
        });
        unavailableTests();
      });

      describe('case: the registration deadline is unavailable', () => {
        beforeEach(() => {
          voteDetails.registrationDeadline = {
            status: RETRIEVAL_STATUS.UNAVAILABLE,
            value: null
          };
        });
        unavailableTests();
      });

      describe('case: the contract address is unavailable', () => {
        beforeEach(() => {
          voteDetails.address = RETRIEVAL_STATUS.UNAVAILABLE;
        });
        unavailableTests();
      });

      describe('case: the registration key modulus is unavailable', () => {
        beforeEach(() => {
          voteDetails.parameters.registration_key.modulus = RETRIEVAL_STATUS.UNAVAILABLE;
        });
        unavailableTests();
      });

      describe('case: the registration key public exponent is unavailable', () => {
        beforeEach(() => {
          voteDetails.parameters.registration_key.public_exp = RETRIEVAL_STATUS.UNAVAILABLE;
        });
        unavailableTests();
      });

      describe('case: phase = "REGISTRATION"', () => {

        beforeEach(() => {
          voteDetails.phase = 'REGISTRATION';
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

          errorSectionTests();

          it(`should display "${RegistrationStatusMessages.closed}"`, () => {
            expect(Page.unavailableSection.nativeElement.innerText).toEqual(RegistrationStatusMessages.closed);
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
            expect(Page.registerSection).toBeTruthy();
          });

          it('should remove the "unavailable" section', () => {
            expect(Page.unavailableSection).toEqual(null);
          });

          xdescribe('case: the deadline expires while the component is active', () => {
            it('should transition to a removed "register" section', () => {
              expect(Page.registerSection).toBeTruthy();
              jasmine.clock().tick(2 * Page.MS_PER_DAY);
              expect(Page.registerSection).toEqual(null);
            });

            it('should create the "unavailable" section', () => {
              expect(Page.unavailableSection).toEqual(null);
              jasmine.clock().tick(2 * Page.MS_PER_DAY);
              expect(Page.unavailableSection).toBeTruthy();
            });

            it(`should display ${RegistrationStatusMessages.closed}`, () => {
              jasmine.clock().tick(2 * Page.MS_PER_DAY);
              expect(Page.unavailableSection.nativeElement.innerText).toEqual(RegistrationStatusMessages.closed);
            });
          });
        });
      });

      describe(`case: in ${VotePhases[1]} phase`, () => {
        beforeEach(() => {
          voteDetails.phase = VotePhases[1];
        });
        registrationClosedTests();
      });

      describe(`case: in ${VotePhases[2]} phase`, () => {
        beforeEach(() => {
          voteDetails.phase = VotePhases[2];
        });
        registrationClosedTests();
      });
    });

    describe('Voter Address', () => {
      beforeEach(() => fixture.detectChanges());

      describe('input box', () => {
        it('should exist', () => {
          expect(Page.voterAddressInput).not.toBeNull();
        });

        it('should start empty', () => {
          expect(Page.voterAddressInput.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Public Address"', () => {
          expect(Page.voterAddressInput.nativeElement.placeholder).toEqual('Public Address');
        });

        it('should be a form control', () => {
          expect(Page.voterAddressInput.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;
          const valid_address: address = '1234567890aabbccddee1234567890aabbccddee';

          beforeEach(() => {
            ctrl = Page.form.get(Page.voterAddressInput.attributes.formControlName);
          });

          it('should be invalid when null', () => {
            DOMInteractionUtility.setValueOn(Page.voterAddressInput, '');
            fixture.detectChanges();
            expect(Page.voterAddressInput.nativeElement.value).toBeFalsy();
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when containing exactly 40 hex characters', () => {
            DOMInteractionUtility.setValueOn(Page.voterAddressInput, valid_address);
            fixture.detectChanges();
            expect(ctrl.valid).toEqual(true);
          });

          xit('should reuse the validator (and tests) from the LaunchVoteComponent -> registration authority address');
        });
      });

      describe('button', () => {
        it('should exist', () => {
          expect(Page.voterAddressButton).not.toBeNull();
        });

        it('should have type "button"', () => {
          expect(Page.voterAddressButton.nativeElement.type).toEqual('button');
        });

        it('should have text "Use Active Account"', () => {
          expect(Page.voterAddressButton.nativeElement.innerText).toEqual('Use Active Account');
        });

        it('should fill the Voter Address input box with the current web3 active account', () => {
          expect(Page.voterAddressInput.nativeElement.value).toBeFalsy();
          DOMInteractionUtility.clickOn(Page.voterAddressButton);
          expect(Page.voterAddressInput.nativeElement.value).toEqual(page.web3Svc.defaultAccount.slice(2));
        });

        it('should raise an error with the Error Service if the default account is undefined', () => {
          spyOnProperty(page.web3Svc, 'defaultAccount').and.returnValue(undefined);
          DOMInteractionUtility.clickOn(Page.voterAddressButton);
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3ServiceErrors.account, null);
        });
      });

      describe('checkbox', () => {
        it('should exist', () => {
          expect(Page.voterAddressAcknowledgement).not.toBeNull();
        });

        it('should start unchecked', () => {
          expect(Page.voterAddressAcknowledgement.componentInstance.checked).toEqual(false);
        });

        it('should be a form control', () => {
          expect(Page.voterAddressAcknowledgement.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          beforeEach(() => {
            ctrl = Page.form.get(Page.voterAddressAcknowledgement.attributes.formControlName);
          });

          it('should be invalid when unchecked', () => {
            expect(Page.voterAddressAcknowledgement.componentInstance.checked).toEqual(false);
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when checked', () => {
            ctrl.setValue(true);
            expect(Page.voterAddressAcknowledgement.componentInstance.checked).toEqual(true);
            expect(ctrl.valid).toEqual(true);
          });
        });
      });
    });

    describe('Anonymous Address', () => {
      beforeEach(() => fixture.detectChanges());

      describe('input box', () => {
        it('should exist', () => {
          expect(Page.anonymousAddressInput).not.toBeNull();
        });

        it('should start empty', () => {
          expect(Page.anonymousAddressInput.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Anonymous Address"', () => {
          expect(Page.anonymousAddressInput.nativeElement.placeholder).toEqual('Anonymous Address');
        });

        it('should be a form control', () => {
          expect(Page.anonymousAddressInput.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;
          const valid_address: address = '1234567890aabbccddee1234567890aabbccddee';

          beforeEach(() => {
            ctrl = Page.form.get(Page.anonymousAddressInput.attributes.formControlName);
          });

          it('should be invalid when null', () => {
            DOMInteractionUtility.setValueOn(Page.anonymousAddressInput, '');
            fixture.detectChanges();
            expect(Page.anonymousAddressInput.nativeElement.value).toBeFalsy();
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when containing exactly 40 hex characters', () => {
            DOMInteractionUtility.setValueOn(Page.anonymousAddressInput, valid_address);
            DOMInteractionUtility.setValueOn(Page.anonymousAddressInput, valid_address);
            fixture.detectChanges();
            expect(ctrl.valid).toEqual(true);
          });

          xit('should reuse the validator (and tests) from the LaunchVoteComponent -> registration authority address');
        });
      });

      describe('button', () => {
        it('should exist', () => {
          expect(Page.anonymousAddressButton).not.toBeNull();
        });

        it('should have type "button"', () => {
          expect(Page.anonymousAddressButton.nativeElement.type).toEqual('button');
        });

        it('should have text "Use Active Account"', () => {
          expect(Page.anonymousAddressButton.nativeElement.innerText).toEqual('Use Active Account');
        });

        it('should fill the Anonymous Address input box with the current web3 active account', () => {
          expect(Page.anonymousAddressInput.nativeElement.value).toBeFalsy();
          DOMInteractionUtility.clickOn(Page.anonymousAddressButton);
          expect(Page.anonymousAddressInput.nativeElement.value).toEqual(page.web3Svc.defaultAccount.slice(2));
        });

        it('should raise an error with the Error Service if the default account is undefined', () => {
          spyOnProperty(page.web3Svc, 'defaultAccount').and.returnValue(undefined);
          DOMInteractionUtility.clickOn(Page.anonymousAddressButton);
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3ServiceErrors.account, null);
        });
      });

      describe('checkbox', () => {
        it('should exist', () => {
          expect(Page.anonymousAddressAcknowledgement).not.toBeNull();
        });

        it('should start unchecked', () => {
          expect(Page.anonymousAddressAcknowledgement.componentInstance.checked).toEqual(false);
        });

        it('should be a form control', () => {
          expect(Page.anonymousAddressAcknowledgement.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          beforeEach(() => {
            ctrl = Page.form.get(Page.anonymousAddressAcknowledgement.attributes.formControlName);
          });

          it('should be invalid when unchecked', () => {
            expect(Page.anonymousAddressAcknowledgement.componentInstance.checked).toEqual(false);
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when checked', () => {
            ctrl.setValue(true);
            expect(Page.anonymousAddressAcknowledgement.componentInstance.checked).toEqual(true);
            expect(ctrl.valid).toEqual(true);
          });
        });
      });
    });

    describe('Blinding Factor', () => {
      const random = (i) => 'MOCK_RANDOM_VALUE_' + i;
      let numRequests;

      beforeEach(() => {
        numRequests = 0;
        spyOn(page.cryptoSvc, 'random').and.callFake(() => {
          numRequests++;
          return random(numRequests);
        });
        fixture.detectChanges();
      });

      describe('input box', () => {
        it('should exist', () => {
          expect(Page.blindingFactorInput).not.toBeNull();
        });

        it('should immediately request 33 bytes of random from the cryptography service', () => {
          expect(page.cryptoSvc.random).toHaveBeenCalledWith(33);
        });

        it('should be initialised to the random value', () => {
          expect(Page.blindingFactorInput.nativeElement.value).toEqual(random(1));
        });

        it('should have a placeholder "Random Blinding Factor"', () => {
          expect(Page.blindingFactorInput.nativeElement.placeholder).toEqual('Random Blinding Factor');
        });

        it('should be a form control', () => {
          expect(Page.blindingFactorInput.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          beforeEach(() => {
            ctrl = Page.form.get(Page.blindingFactorInput.attributes.formControlName);
          });

          it('should be invalid when null', () => {
            DOMInteractionUtility.setValueOn(Page.blindingFactorInput, '');
            fixture.detectChanges();
            expect(Page.blindingFactorInput.nativeElement.value).toBeFalsy();
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when populated', () => {
            fixture.detectChanges();
            expect(Page.blindingFactorInput.nativeElement.value).toBeTruthy();
            expect(ctrl.valid).toEqual(true);
          });
        });
      });

      describe('button', () => {
        it('should exist', () => {
          expect(Page.blindingFactorButton).not.toBeNull();
        });

        it('should have type "button"', () => {
          expect(Page.blindingFactorButton.nativeElement.type).toEqual('button');
        });

        it('should have text "Regenerate"', () => {
          expect(Page.blindingFactorButton.nativeElement.innerText).toEqual('Regenerate');
        });

        it('should fill the Blinding Factor input box with 33 bytes of fresh random', () => {
          expect(Page.blindingFactorInput.nativeElement.value).toEqual(random(1));
          DOMInteractionUtility.clickOn(Page.blindingFactorButton);
          expect(Page.blindingFactorInput.nativeElement.value).toEqual(random(2));
        });
      });

      describe('save checkbox', () => {
        it('should exist', () => {
          expect(Page.blindingFactorSaveAcknowledgement).not.toBeNull();
        });

        it('should start unchecked', () => {
          expect(Page.blindingFactorSaveAcknowledgement.componentInstance.checked).toEqual(false);
        });

        it('should be a form control', () => {
          expect(Page.blindingFactorSaveAcknowledgement.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          beforeEach(() => {
            ctrl = Page.form.get(
              Page.blindingFactorSaveAcknowledgement.attributes.formControlName
            );
          });

          it('should be invalid when unchecked', () => {
            expect(Page.blindingFactorSaveAcknowledgement.componentInstance.checked).toEqual(false);
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when checked', () => {
            ctrl.setValue(true);
            expect(Page.blindingFactorSaveAcknowledgement.componentInstance.checked).toEqual(true);
            expect(ctrl.valid).toEqual(true);
          });
        });
      });

      describe('protect checkbox', () => {
        it('should exist', () => {
          expect(Page.blindingFactorProtectAcknowledgement).not.toBeNull();
        });

        it('should start unchecked', () => {
          expect(Page.blindingFactorProtectAcknowledgement.componentInstance.checked).toEqual(false);
        });

        it('should be a form control', () => {
          expect(Page.blindingFactorProtectAcknowledgement.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          beforeEach(() => {
            ctrl = Page.form.get(
              Page.blindingFactorProtectAcknowledgement.attributes.formControlName
            );
          });

          it('should be invalid when unchecked', () => {
            expect(Page.blindingFactorProtectAcknowledgement.componentInstance.checked).toEqual(false);
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when checked', () => {
            ctrl.setValue(true);
            expect(Page.blindingFactorProtectAcknowledgement.componentInstance.checked).toEqual(true);
            expect(ctrl.valid).toEqual(true);
          });
        });
      });
    });
  });

  describe('Functionality', () => {
    const populateForm = () => {
      Page.form.controls.voterAddress.patchValue(voter.public_address);
      Page.form.controls.voterAddressAck.patchValue(true);
      Page.form.controls.anonymousAddress.patchValue(voter.anonymous_address);
      Page.form.controls.anonymousAddressAck.patchValue(true);
      Page.form.controls.blindingFactor.patchValue(voter.blinding_factor);
      Page.form.controls.blindingFactorSaveAck.patchValue(true);
      Page.form.controls.blindingFactorProtectAck.patchValue(true);
      fixture.detectChanges();
    };

    describe('Submit button', () => {
      let button;

      beforeEach(() => {
        fixture.detectChanges();
        button = Page.submitButtons[0];
      });

      it('should exist', () => {
        expect(button).toBeDefined();
      });

      it('should be the only one', () => {
        expect(Page.submitButtons.length).toEqual(1);
      });

      it('should be disabled when the form is invalid', () => {
        expect(Page.form.valid).toEqual(false);
        expect(button.nativeElement.disabled).toEqual(true);
      });

      it('should be enabled when the form is valid', () => {
        populateForm();
        expect(Page.form.valid).toEqual(true);
        expect(button.nativeElement.disabled).toEqual(false);
      });

      describe('form submission', () => {
        beforeEach(() => populateForm());

        it('should pass the form details to the VoteManager service', () => {
          spyOn(page.voteManagerSvc, 'registerAt$').and.callThrough();
          DOMInteractionUtility.clickOn(button);
          expect(page.voteManagerSvc.registerAt$).toHaveBeenCalledWith(
            voteDetails.address,
            voteDetails.parameters.registration_key,
            voter.public_address,
            voter.anonymous_address,
            voter.blinding_factor
          );
        });

        describe('case: VoteManager service returns a transaction receipt', () => {
          it('should reset the form', () => {
            Page.form.markAsDirty();
            DOMInteractionUtility.clickOn(button);
            expect(Page.form.pristine).toEqual(true);
          });
        });

        describe('case: VoteManager service returns an empty observable', () => {
          beforeEach(() => spyOn(page.voteManagerSvc, 'registerAt$').and.returnValue(Observable.empty()));

          it('should not reset the form', () => {
            Page.form.markAsDirty();
            DOMInteractionUtility.clickOn(button);
            expect(Page.form.pristine).toEqual(false);
          });
        });
      });
    });
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
