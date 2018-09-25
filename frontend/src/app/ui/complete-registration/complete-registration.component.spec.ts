import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CryptographyService } from '../../core/cryptography/cryptography.service';
import { ErrorService } from '../../core/error-service/error.service';
import { Web3Errors } from '../../core/ethereum/web3-errors';
import { Web3Service } from '../../core/ethereum/web3.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Mock } from '../../mock/module';
import { EthereumAddressValidatorTester } from '../../validators/ethereum-address.validator.tests';
import { LowercaseHexValidatorTests } from '../../validators/lowercase-hex.validator.tests';
import { CompleteRegistrationComponent } from './complete-registration.component';

fdescribe('Component: CompleteRegistrationComponent', () => {
  let fixture: ComponentFixture<CompleteRegistrationComponent>;
  let page: Page;

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
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CompleteRegistrationComponent
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
        {provide: VoteManagerService, useClass: Mock.VoteManagerService},
        {provide: CryptographyService, useClass: Mock.CryptographyService},
        {provide: Web3Service, useClass: Mock.Web3Service}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(CompleteRegistrationComponent);
        page = new Page();
      });
  }));

  beforeEach(() => spyOn(page.errSvc, 'add').and.stub());

  describe('User Interface', () => {
    describe('Registration Authority Address', () => {
      let inputBox: DebugElement;
      let button: DebugElement;

      beforeEach(() => {
        fixture.detectChanges();
        inputBox = fixture.debugElement.query(By.css('input[formControlName="regAuthAddress"'));
        button = fixture.debugElement.query(By.css('button#fillRegAuthAddress'));
      });

      describe('input box', () => {
        it('should exist', () => {
          expect(inputBox).not.toBeNull();
        });

        it('should start empty', () => {
          expect(inputBox.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Registration Authority Address"', () => {
          expect(inputBox.nativeElement.placeholder).toEqual('Registration Authority Address');
        });

        it('should be a form control', () => {
          expect(inputBox.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(inputBox, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = fixture.componentInstance.form.get(inputBox.attributes.formControlName);
          });

          EthereumAddressValidatorTester.test(() => ctrl, setValue);
        });
      });


      describe('button', () => {
        it('should exist', () => {
          expect(button).not.toBeNull();
        });

        it('should have type "button"', () => {
          expect(button.nativeElement.type).toEqual('button');
        });

        it('should have text "Use Active Account"', () => {
          expect(button.nativeElement.innerText).toEqual('Use Active Account');
        });

        it('should fill the Registration Authority Address input box with the current web3 active account', () => {
          expect(inputBox.nativeElement.value).toBeFalsy();
          DOMInteractionUtility.clickOn(button);
          expect(inputBox.nativeElement.value).toEqual(page.web3Svc.defaultAccount.slice(2));
        });

        it('should raise an error with the Error Service if the default account is undefined', () => {
          spyOnProperty(page.web3Svc, 'defaultAccount').and.returnValue(undefined);
          DOMInteractionUtility.clickOn(button);
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3Errors.account, null);
        });
      });
    });

    describe('Modulus', () => {
      let inputBox: DebugElement;

      beforeEach(() => {
        fixture.detectChanges();
        inputBox = fixture.debugElement.query(By.css('input[formControlName="modulus"'));
      });

      describe('input box', () => {
        it('should exist', () => {
          expect(inputBox).not.toBeNull();
        });

        it('should start empty', () => {
          expect(inputBox.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Modulus"', () => {
          expect(inputBox.nativeElement.placeholder).toEqual('Modulus');
        });

        it('should be a form control', () => {
          expect(inputBox.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(inputBox, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = fixture.componentInstance.form.get(inputBox.attributes.formControlName);
          });

          LowercaseHexValidatorTests.test(() => ctrl, setValue);
        });
      });
    });

    describe('Private Exponent', () => {
      let inputBox: DebugElement;

      beforeEach(() => {
        fixture.detectChanges();
        inputBox = fixture.debugElement.query(By.css('input[formControlName="privateExponent"'));
      });

      describe('input box', () => {
        it('should exist', () => {
          expect(inputBox).not.toBeNull();
        });

        it('should start empty', () => {
          expect(inputBox.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Private Exponent"', () => {
          expect(inputBox.nativeElement.placeholder).toEqual('Private Exponent');
        });

        it('should be a form control', () => {
          expect(inputBox.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(inputBox, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = fixture.componentInstance.form.get(inputBox.attributes.formControlName);
          });

          LowercaseHexValidatorTests.test(() => ctrl, setValue);
        });
      });
    });
  });
});
