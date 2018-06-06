import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { MatRadioGroup } from '@angular/material';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { IAnonymousVotingContractCollection, IVoter, Mock } from '../../mock/module';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { ErrorService } from '../../core/error-service/error.service';
import { VotingPhaseComponent, VotingStatusMessages } from './voting-phase.component';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { address } from '../../core/ethereum/type.mappings';
import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';

describe('Component: VotingPhaseComponent', () => {
  let fixture: ComponentFixture<VotingPhaseComponent>;
  let page: Page;

  const voteIndex = 0; // a contract in the voting phase
  const voteCollection: IAnonymousVotingContractCollection = Mock.AnonymousVotingContractCollections[voteIndex];
  const voter: IVoter = Mock.Voters[0];
  let voteDetails: IVotingContractDetails;

  class Page {
    public static MS_PER_DAY: number = 1000 * 60 * 60 * 24;
    public voteRetrievalSvc: VoteRetrievalService;
    public voteManagerSvc: VoteManagerService;
    public web3Svc: Web3Service;
    public errSvc: ErrorService;

    constructor() {
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
      this.voteManagerSvc = fixture.debugElement.injector.get(VoteManagerService);
      this.web3Svc = fixture.debugElement.injector.get(Web3Service);
      this.errSvc = fixture.debugElement.injector.get(ErrorService);
    }

    // use getters because the components are added/removed from the DOM

    static get form(): FormGroup {
      return fixture.componentInstance.form;
    }

    static get votingSection(): DebugElement {
      return fixture.debugElement.query(By.css('#voting'));
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
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService},
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
    // put us in the Voting phase
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
      },
      pendingRegistrations: {
        status: RETRIEVAL_STATUS.AVAILABLE,
        value: 0
      }
    };
    spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(Observable.of(voteDetails));
    spyOn(page.errSvc, 'add').and.stub();

    const now = (voteDetails.votingDeadline.value.getTime() + voteDetails.registrationDeadline.value.getTime()) / 2;
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(now));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('User Interface', () => {
    describe('component status', () => {
      const errorSectionTests = (msg) => {
        beforeEach(() => fixture.detectChanges());

        it('should remove the "voting" section', () => {
          expect(Page.votingSection).toEqual(null);
        });

        it('should create the "unavailable" section', () => {
          expect(Page.unavailableSection).toBeTruthy();
        });

        it(`should display "${msg}"`, () => {
          expect(Page.unavailableSection.nativeElement.innerText).toEqual(msg);
        });
      };

      const retrievingTests = () => {
        errorSectionTests(VotingStatusMessages.retrieving);
      };

      const unavailableTests = () => {
        errorSectionTests(VotingStatusMessages.unavailable);
      };

      const pendingTests = (count) => {
        errorSectionTests(VotingStatusMessages.pending(count));
      };

      const notOpenedTests = () => {
        errorSectionTests(VotingStatusMessages.notOpened);
      };

      const closedTests = () => {
        errorSectionTests(VotingStatusMessages.closed);
      };

      describe('case: the registration deadline is being retrieved', () => {
        beforeEach(() => {
          voteDetails.registrationDeadline = {
            status: RETRIEVAL_STATUS.RETRIEVING,
            value: null
          };
        });
        retrievingTests();
      });

      describe('case: the voting deadline is being retrieved', () => {
        beforeEach(() => {
          voteDetails.votingDeadline = {
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

      describe('case: the number of pending registrations is being retrieved', () => {
        beforeEach(() => {
          voteDetails.pendingRegistrations = {
            status: RETRIEVAL_STATUS.RETRIEVING,
            value: null
          };
        });
        retrievingTests();
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

      describe('case: the voting deadline is unavailable', () => {
        beforeEach(() => {
          voteDetails.votingDeadline = {
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

      describe('case: the number of pending registrations is unavailable', () => {
        beforeEach(() => {
          voteDetails.pendingRegistrations = {
            status: RETRIEVAL_STATUS.UNAVAILABLE,
            value: null
          };
        });
        unavailableTests();
      });

      describe('case: the registration deadline is in the future', () => {
        beforeEach(() => {
          jasmine.clock().mockDate(new Date(voteDetails.registrationDeadline.value.getTime() - Page.MS_PER_DAY));
        });
        notOpenedTests();
      });

      describe('case: the voting deadline is in the past', () => {
        beforeEach(() => {
          jasmine.clock().mockDate(new Date(voteDetails.votingDeadline.value.getTime() + Page.MS_PER_DAY));
        });
        closedTests();
      });

      describe('case: we are in the Voting phase', () => {
        describe('case: the number of pending registrations is positive', () => {
          const numPendingRegistrations = 3;

          beforeEach(() => {
            voteDetails.pendingRegistrations.value = numPendingRegistrations;
          });

          pendingTests(numPendingRegistrations);
        });

        describe('case: the number of pending registrations is zero', () => {
          beforeEach(() => {
            fixture.detectChanges();
          });

          it('should create the "voting" section', () => {
            expect(Page.votingSection).toBeTruthy();
          });

          it('should remove the "unavailable" section', () => {
            expect(Page.unavailableSection).toBeNull();
          });
        });
      });

      xdescribe('case: the registration deadline expires while the component is active', () => {
      });

      xdescribe('case: the voting deadline expires while the component is active', () => {
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
      beforeEach(() => fixture.detectChanges());

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
          expect(buttons.length).toEqual(voteDetails.parameters.candidates.length);
        });

        describe('each radio button', () => {
          it('should display the candidate', () => {
            voteDetails.parameters.candidates.forEach((candidate, idx) => {
              expect(buttons[idx].nativeElement.innerText.trim()).toEqual(candidate);
            });
          });

          it('should have a value corresponding to its position in the candidate list', () => {
            voteDetails.parameters.candidates.forEach((candidate, idx) => {
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
        beforeEach(() => populateForm());

        it('should retrieve the blind signature from the VoteRetrievalService', () => {
          spyOn(page.voteRetrievalSvc, 'blindSignatureAt$').and.callThrough();
          DOMInteractionUtility.clickOn(button);
          expect(page.voteRetrievalSvc.blindSignatureAt$)
            .toHaveBeenCalledWith(voteDetails.address, voter.public_address);
        });

        it('should pass the form details to the VoteManager service', () => {
          spyOn(page.voteManagerSvc, 'voteAt$').and.callThrough();
          DOMInteractionUtility.clickOn(button);
          expect(page.voteManagerSvc.voteAt$).toHaveBeenCalledWith(
            voteDetails.address,
            voteDetails.parameters.registration_key,
            voter.anonymous_address,
            voter.signed_blinded_address,
            voter.blinding_factor,
            voter.vote.candidateIdx
          );
        });

        describe('case: the blind signature cannot be retrieved', () => {
          beforeEach(() => spyOn(page.voteRetrievalSvc, 'blindSignatureAt$').and.returnValue(Observable.empty()));

          it('should not reset the form', () => {
            Page.form.markAsDirty();
            DOMInteractionUtility.clickOn(button);
            expect(Page.form.pristine).toEqual(false);
          });
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

