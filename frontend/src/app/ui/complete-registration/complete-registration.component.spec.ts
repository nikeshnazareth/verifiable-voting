import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs/Observable';
import 'rxjs/observable/of';

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

describe('Component: CompleteRegistrationComponent', () => {
  let fixture: ComponentFixture<CompleteRegistrationComponent>;
  let page: Page;

  class Page {
    public errSvc: ErrorService;
    public web3Svc: Web3Service;
    public cryptoSvc: CryptographyService;
    public voteManagerSvc: VoteManagerService;
    public voteRetrievalSvc: VoteRetrievalService;

    constructor() {
      this.web3Svc = fixture.debugElement.injector.get(Web3Service);
      this.errSvc = fixture.debugElement.injector.get(ErrorService);
      this.cryptoSvc = fixture.debugElement.injector.get(CryptographyService);
      this.voteManagerSvc = fixture.debugElement.injector.get(VoteManagerService);
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
    }


    get registrationAuthInputBox() {
      return fixture.debugElement.query(By.css('input[formControlName="regAuthAddress"'));
    }

    get registrationAuthButton() {
      return fixture.debugElement.query(By.css('button#fillRegAuthAddress'));
    }

    get modulusInputBox() {
      return fixture.debugElement.query(By.css('input[formControlName="modulus"'));
    }

    get privateExponentInputBox() {
      return fixture.debugElement.query(By.css('input[formControlName="privateExponent"'));
    }

    get submitButton() {
      return fixture.debugElement.query(By.css('button[type="submit"]'));
    }

    get form() {
      return fixture.componentInstance.form;
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

      beforeEach(() => fixture.detectChanges());

      describe('input box', () => {
        it('should exist', () => {
          expect(page.registrationAuthInputBox).not.toBeNull();
        });

        it('should start empty', () => {
          expect(page.registrationAuthInputBox.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Registration Authority Address"', () => {
          expect(page.registrationAuthInputBox.nativeElement.placeholder).toEqual('Registration Authority Address');
        });

        it('should be a form control', () => {
          expect(page.registrationAuthInputBox.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(page.registrationAuthInputBox, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = page.form.get(page.registrationAuthInputBox.attributes.formControlName);
          });

          EthereumAddressValidatorTester.test(() => ctrl, setValue);
        });
      });


      describe('button', () => {
        it('should exist', () => {
          expect(page.registrationAuthButton).not.toBeNull();
        });

        it('should have type "button"', () => {
          expect(page.registrationAuthButton.nativeElement.type).toEqual('button');
        });

        it('should have text "Use Active Account"', () => {
          expect(page.registrationAuthButton.nativeElement.innerText).toEqual('Use Active Account');
        });

        it('should fill the Registration Authority Address input box with the current web3 active account', () => {
          expect(page.registrationAuthInputBox.nativeElement.value).toBeFalsy();
          DOMInteractionUtility.clickOn(page.registrationAuthButton);
          expect(page.registrationAuthInputBox.nativeElement.value).toEqual(page.web3Svc.defaultAccount.slice(2));
        });

        it('should raise an error with the Error Service if the default account is undefined', () => {
          spyOnProperty(page.web3Svc, 'defaultAccount').and.returnValue(undefined);
          DOMInteractionUtility.clickOn(page.registrationAuthButton);
          expect(page.errSvc.add).toHaveBeenCalledWith(Web3Errors.account, null);
        });
      });
    });

    describe('Modulus', () => {
      beforeEach(() => fixture.detectChanges());

      describe('input box', () => {
        it('should exist', () => {
          expect(page.modulusInputBox).not.toBeNull();
        });

        it('should start empty', () => {
          expect(page.modulusInputBox.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Modulus"', () => {
          expect(page.modulusInputBox.nativeElement.placeholder).toEqual('Modulus');
        });

        it('should be a form control', () => {
          expect(page.modulusInputBox.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(page.modulusInputBox, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = page.form.get(page.modulusInputBox.attributes.formControlName);
          });

          LowercaseHexValidatorTests.test(() => ctrl, setValue);
        });
      });
    });

    describe('Private Exponent', () => {
      beforeEach(() => fixture.detectChanges());

      describe('input box', () => {
        it('should exist', () => {
          expect(page.privateExponentInputBox).not.toBeNull();
        });

        it('should start empty', () => {
          expect(page.privateExponentInputBox.nativeElement.value).toBeFalsy();
        });

        it('should have a placeholder "Private Exponent"', () => {
          expect(page.privateExponentInputBox.nativeElement.placeholder).toEqual('Private Exponent');
        });

        it('should be a form control', () => {
          expect(page.privateExponentInputBox.attributes.formControlName).not.toBeNull();
        });

        describe('form control validity', () => {
          let ctrl: AbstractControl;

          const setValue = (value) => {
            DOMInteractionUtility.setValueOn(page.privateExponentInputBox, value);
            fixture.detectChanges();
          };

          beforeEach(() => {
            ctrl = page.form.get(page.privateExponentInputBox.attributes.formControlName);
          });

          LowercaseHexValidatorTests.test(() => ctrl, setValue);
        });
      });
    });
  });

  describe('Functionality', () => {
    describe('Denote "Vote with Registration Authority A and Key K has N pending registrations" as (A,K,N)', () => {
      describe('scenario: [(R0, K0, 2); (R0, K1, 0); (R0, K0, 1); (R1, K2, 2)]', () => {
        const range = (count) => Array(count).fill(0).map((_, idx) => idx);
        const regAuths = range(2).map(idx => '0x' + Array(40).fill(idx).join(''));
        const regKeys = range(3).map(idx => ({
          modulus: '0xdeadbabe' + idx,
          public_exp: '0x10001' + idx
        }));

        const votes = [
          {address: 'MOCK_ADDRESS_0', regAuth: regAuths[0], key: regKeys[0], numPending: 2},
          {address: 'MOCK_ADDRESS_1', regAuth: regAuths[0], key: regKeys[1], numPending: 0},
          {address: 'MOCK_ADDRESS_2', regAuth: regAuths[0], key: regKeys[0], numPending: 1},
          {address: 'MOCK_ADDRESS_3', regAuth: regAuths[1], key: regKeys[2], numPending: 2},
        ];

        const private_exp = 'cafebabe';

        let privateExponentMatches: boolean;
        const completed$: Observable<void> = Observable.of(null);

        beforeEach(() => {
          const originalDetailsAtIndex$ = page.voteRetrievalSvc.detailsAtIndex$;
          spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.callFake(idx =>
            originalDetailsAtIndex$(idx)
              .do(details => {
                details.address.value = votes[idx].address;
                details.registrationAuthority.value = votes[idx].regAuth;
                details.key.value = votes[idx].key;
                details.pendingRegistrations.value = range(votes[idx].numPending).map(voterIdx => ({
                  voter: Mock.Voters[voterIdx].public_address,
                  blindedAddress: Mock.Voters[voterIdx].blinded_address
                }));
              })
          );
          spyOn(page.cryptoSvc, 'isPrivateExponent').and.callFake(() => privateExponentMatches);
          spyOn(page.voteManagerSvc, 'completeRegistrationAt$').and.returnValue(completed$);
          fixture.detectChanges();
        });

        regAuths.map((regAuth, regAuthIdx) => {
          describe(`case: the Registration Authority is set to R${regAuthIdx}`, () => {
            beforeEach(() => {
              DOMInteractionUtility.setValueOn(page.registrationAuthInputBox, regAuth.slice(2));
              fixture.detectChanges();
            });

            regKeys.map((regKey, regKeyIdx) => {
              describe(`case: the modulus is set to K${regKeyIdx}`, () => {
                beforeEach(() => {
                  DOMInteractionUtility.setValueOn(page.modulusInputBox, regKey.modulus.slice(2));
                  fixture.detectChanges();
                });

                [true, false].map(isPrivateExp => {
                  describe(`case: the private exponent ${isPrivateExp ? 'matches' : 'does not match'} the registration key`, () => {
                    beforeEach(() => {
                      privateExponentMatches = isPrivateExp;
                      DOMInteractionUtility.setValueOn(page.privateExponentInputBox, private_exp); // make the control valid
                      fixture.detectChanges();
                    });

                    const numCompletable = isPrivateExp ?
                      votes.filter(vote => vote.regAuth === regAuth && vote.key === regKey)
                        .map(vote => vote.numPending)
                        .reduce((a, b) => a + b, 0) :
                      0;
                    const isValid = numCompletable > 0;
                    const validStr = isValid ? 'valid' : 'invalid';

                    describe('existsCompletable', () => {
                      const getCtrl = () => page.form.get('existsCompletable');

                      it(`should be ${validStr}`, () => {
                        expect(getCtrl().valid).toEqual(isValid);
                      });
                    });

                    it(`form should be ${validStr}`, () => {
                      expect(page.form.valid).toEqual(isValid);
                    });

                    describe('form submission', () => {
                      beforeEach(() => {
                       DOMInteractionUtility.clickOn(page.submitButton);
                       fixture.detectChanges();
                      });

                      if (isValid) {
                        it(`should call "completeRegistrationAt$" ${numCompletable} times`, () => {
                          expect(page.voteManagerSvc.completeRegistrationAt$).toHaveBeenCalledTimes(numCompletable);
                        });

                        it('should pass the completable registrations to "completeRegistrationAt$"', () => {
                          votes.filter(vote => vote.regAuth === regAuth && vote.key === regKey)
                            .map(vote => {
                              Mock.Voters.slice(0, vote.numPending).map(voter => {
                                expect(page.voteManagerSvc.completeRegistrationAt$).toHaveBeenCalledWith(
                                  vote.address,
                                  voter.public_address,
                                  vote.regAuth,
                                  vote.key,
                                  `0x${private_exp}`,
                                  voter.blinded_address
                                );
                              });
                            });
                        });

                        xit('should reset the form', () => {
                          expect(page.form.pristine).toEqual(true);
                        });
                      } else {

                        it('should not call "completeRegistrationsAt$"', () => {
                          expect(page.voteManagerSvc.completeRegistrationAt$).not.toHaveBeenCalled();
                        });

                        xit('should not reset the form', () => {
                          expect(page.form.pristine).toEqual(false);
                        });
                      }
                    });

                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
