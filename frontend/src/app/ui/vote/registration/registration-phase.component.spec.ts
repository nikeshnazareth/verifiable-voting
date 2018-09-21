import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs/Observable';

import { CryptographyService } from '../../../core/cryptography/cryptography.service';
import { ErrorService } from '../../../core/error-service/error.service';
import { Web3Errors } from '../../../core/ethereum/web3-errors';
import { Web3Service} from '../../../core/ethereum/web3.service';
import { VoteManagerService } from '../../../core/vote-manager/vote-manager.service';
import { MaterialModule } from '../../../material/material.module';
import { DOMInteractionUtility } from '../../../mock/dom-interaction-utility';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../../mock/module';
import { EthereumAddressValidatorTester } from '../../../validators/ethereum-address.validator.tests';
import { RegistrationPhaseComponent } from './registration-phase.component';

describe('Component: RegistrationPhaseComponent', () => {
  let fixture: ComponentFixture<RegistrationPhaseComponent>;
  let page: Page;

  const voter: IVoter = Mock.Voters[0];
  const collection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[0];

  class Page {
    public errSvc: ErrorService;
    public web3Svc: Web3Service;
    public cryptoSvc: CryptographyService;
    public voteManagerSvc: VoteManagerService;

    constructor() {
      this.web3Svc = fixture.debugElement.injector.get(Web3Service);
      this.errSvc = fixture.debugElement.injector.get(ErrorService);
      this.cryptoSvc = fixture.debugElement.injector.get(CryptographyService);
      this.voteManagerSvc = fixture.debugElement.injector.get(VoteManagerService);
    }

    // use getters because the components are added to the DOM after initialisation

    static get form(): FormGroup {
      return fixture.componentInstance.form;
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
        RegistrationPhaseComponent
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
        {provide: VoteManagerService, useClass: Mock.VoteManagerService},
        {provide: Web3Service, useClass: Mock.Web3Service}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(RegistrationPhaseComponent);
        page = new Page();
      });
  }));

  beforeEach(() => {
    spyOn(page.errSvc, 'add').and.stub();
  });

  describe('User Interface', () => {
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
          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(Page.voterAddressInput, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = Page.form.get(Page.voterAddressInput.attributes.formControlName);
          });

          EthereumAddressValidatorTester.test(() => ctrl, setValue);
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
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3Errors.account, null);
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
          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(Page.anonymousAddressInput, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = Page.form.get(Page.anonymousAddressInput.attributes.formControlName);
          });

          EthereumAddressValidatorTester.test(() => ctrl, setValue);
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
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3Errors.account, null);
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
        beforeEach(() => {
          fixture.componentInstance.contract = collection.address;
          fixture.componentInstance.key = collection.parameters.registration_key;
          populateForm();
        });

        it('should pass the form details to the VoteManager service', () => {
          spyOn(page.voteManagerSvc, 'registerAt$').and.callThrough();
          DOMInteractionUtility.clickOn(button);
          expect(page.voteManagerSvc.registerAt$).toHaveBeenCalledWith(
            collection.address,
            collection.parameters.registration_key,
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
