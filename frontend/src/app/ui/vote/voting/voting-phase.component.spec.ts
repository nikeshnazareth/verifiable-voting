import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatRadioGroup } from '@angular/material';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs/Observable';

import { ErrorService } from '../../../core/error-service/error.service';
import { Web3Errors } from '../../../core/ethereum/web3-errors';
import { Web3Service } from '../../../core/ethereum/web3.service';
import { VoteManagerService } from '../../../core/vote-manager/vote-manager.service';
import { MaterialModule } from '../../../material/material.module';
import { DOMInteractionUtility } from '../../../mock/dom-interaction-utility';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../../mock/module';
import { EthereumAddressValidatorTester } from '../../../validators/ethereum-address.validator.tests';
import { VotingPhaseComponent } from './voting-phase.component';

describe('Component: VotingPhaseComponent', () => {
  let fixture: ComponentFixture<VotingPhaseComponent>;
  let page: Page;

  const voteIndex = 0; // a contract in the voting phase
  const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[voteIndex];
  const voter: IVoter = Mock.Voters[0];

  class Page {
    public voteManagerSvc: VoteManagerService;
    public web3Svc: Web3Service;
    public errSvc: ErrorService;

    constructor() {
      this.voteManagerSvc = fixture.debugElement.injector.get(VoteManagerService);
      this.web3Svc = fixture.debugElement.injector.get(Web3Service);
      this.errSvc = fixture.debugElement.injector.get(ErrorService);
    }

    // use getters because the components are added/removed from the DOM

    static get form(): FormGroup {
      return fixture.componentInstance.form;
    }

    static get voterAddressInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="voterAddress"]'));
    }

    static get voterAddressButton(): DebugElement {
      return fixture.debugElement.query(By.css('button#fillVoterAddress'));
    }

    static get anonymousAddressInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="anonymousAddress"]'));
    }

    static get anonymousAddressButton(): DebugElement {
      return fixture.debugElement.query(By.css('button#fillAnonymousAddress'));
    }

    static get blindingFactorInput(): DebugElement {
      return fixture.debugElement.query(By.css('input[formControlName="blindingFactor"]'));
    }

    static get candidateRadioGroup(): DebugElement {
      return fixture.debugElement.query(By.css('mat-radio-group'));
    }

    static get submitButtons(): DebugElement[] {
      return fixture.debugElement.queryAll(By.css('button[type="submit"]'));
    }
  }


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        VotingPhaseComponent
      ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
      ],
      providers: [
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service},
        {provide: VoteManagerService, useClass: Mock.VoteManagerService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(VotingPhaseComponent);
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
    });

    describe('Blinding Factor', () => {
      beforeEach(() => {
        fixture.detectChanges();
      });

      describe('input box', () => {
        it('should exist', () => {
          expect(Page.blindingFactorInput).not.toBeNull();
        });

        it('should start empty', () => {
          expect(Page.blindingFactorInput.nativeElement.value).toBeFalsy();
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
            const mockBlindingFactor: string = 'MOCK_BLINDING_FACTOR';
            DOMInteractionUtility.setValueOn(Page.blindingFactorInput, mockBlindingFactor);
            fixture.detectChanges();
            expect(Page.blindingFactorInput.nativeElement.value).toBeTruthy();
            expect(ctrl.valid).toEqual(true);
          });
        });
      });
    });

    describe('Chosen candidate', () => {
      beforeEach(() => {
        fixture.componentInstance.candidates = voteCollection.parameters.candidates;
        fixture.detectChanges();
      });

      it('should exist', () => {
        expect(Page.candidateRadioGroup).not.toBeNull();
      });

      it('should start with no selection', () => {
        expect((<MatRadioGroup> Page.candidateRadioGroup.componentInstance).value).toBeFalsy();
      });

      it('should be a form control', () => {
        expect(Page.candidateRadioGroup.attributes.formControlName).not.toBeNull();
      });

      describe('radio buttons', () => {
        let buttons: DebugElement[];

        beforeEach(() => {
          buttons = Page.candidateRadioGroup.queryAll(By.css('mat-radio-button'));
        });

        it('should have a radio button per candidate', () => {
          expect(buttons.length).toEqual(voteCollection.parameters.candidates.length);
        });

        describe('each radio button', () => {
          it('should display the candidate', () => {
            voteCollection.parameters.candidates.forEach((candidate, idx) => {
              expect(buttons[idx].nativeElement.innerText.trim()).toEqual(candidate);
            });
          });

          it('should have a value corresponding to its position in the candidate list', () => {
            voteCollection.parameters.candidates.forEach((candidate, idx) => {
              expect(buttons[idx].componentInstance.value).toEqual(idx);
            });
          });

          xit('should set the candidate radio group value when selected');
        });
      });

      describe('form validity', () => {
        let ctrl: AbstractControl;

        beforeEach(() => {
          ctrl = Page.form.get(Page.candidateRadioGroup.attributes.formControlName);
        });

        it('should be invalid when nothing is selected', () => {
          expect(ctrl.valid).toEqual(false);
        });

        it('should be valid when a radio button is selected', () => {
          ctrl.setValue(2);
          expect(ctrl.valid).toEqual(true);
        });
      });
    });

  });

  describe('Functionality', () => {
    const populateForm = () => {
      Page.form.controls.voterAddress.patchValue(voter.public_address);
      Page.form.controls.anonymousAddress.patchValue(voter.anonymous_address);
      Page.form.controls.blindingFactor.patchValue(voter.blinding_factor);
      Page.form.controls.chosenCandidate.patchValue(voter.vote.candidateIdx);
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
          fixture.componentInstance.contract = voteCollection.address;
          fixture.componentInstance.key = voteCollection.parameters.registration_key;
          fixture.componentInstance.candidates = voteCollection.parameters.candidates;
          fixture.componentInstance.registration = {};
          Mock.Voters.map(v => {
            fixture.componentInstance.registration[v.public_address] = {
              blindSignature: v.signed_blinded_address
            };
          });
          populateForm();
        });

        it('should pass the form details to the VoteManager service', () => {
          spyOn(page.voteManagerSvc, 'voteAt$').and.callThrough();
          DOMInteractionUtility.clickOn(button);
          expect(page.voteManagerSvc.voteAt$).toHaveBeenCalledWith(
            voteCollection.address,
            voteCollection.parameters.registration_key,
            voter.anonymous_address,
            voter.signed_blinded_address,
            voter.blinding_factor,
            voter.vote.candidateIdx
          );
        });

        describe('case: VoteManager service returns a receipt', () => {
          it('should reset the form', () => {
            Page.form.markAsDirty();
            DOMInteractionUtility.clickOn(button);
            expect(Page.form.pristine).toEqual(true);
          });
        });

        describe('case: VoteManager service returns an empty observable', () => {
          beforeEach(() => spyOn(page.voteManagerSvc, 'voteAt$').and.returnValue(Observable.empty()));

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

