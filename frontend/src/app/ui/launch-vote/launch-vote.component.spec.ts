import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { AbstractControl, FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { DebugElement, OnInit } from '@angular/core';

import { LaunchVoteComponent } from './launch-vote.component';
import { MaterialModule } from '../../material/material.module';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';


describe('Component: LaunchVoteComponent', () => {
  let fixture: ComponentFixture<TestLaunchVoteComponent>;
  let page: Page;
  const mockVoteCollection: IAnonymousVotingContractCollection =
    Mock.AnonymousVotingContractCollections[0];

  class Page {
    public voteManagerSvc: VoteManagerService;
    public topicInput: DebugElement;
    public timeframes: DebugElement[];
    public newCandidate: DebugElement;
    public newCandidateButton: DebugElement;
    public form: FormGroup;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.voteManagerSvc = compInjector.get(VoteManagerService);
      this.topicInput = fixture.debugElement.query(By.css('input[formControlName="topic"]'));
      this.timeframes = fixture.debugElement.queryAll(By.css('[formGroupName="timeframes"] > mat-form-field'));
      this.newCandidate = fixture.debugElement.query(By.css('input[formControlName="newCandidate"]'));
      this.newCandidateButton = fixture.debugElement.query(By.css('#addCandidateButton'));
      this.form = fixture.componentInstance.form;
    }

    get candidateElements(): DebugElement[] {
      return fixture.debugElement.query(By.css('[formArrayName="candidates"]')).children;
    }

    static setInput(input: DebugElement, value: string) {
      input.nativeElement.value = value;
      input.nativeElement.dispatchEvent(new Event('input')); // trigger change detection
      fixture.detectChanges();
    }

    static pressEnter(input: DebugElement) {
      input.nativeElement.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter'}));
    }

    static click(button: DebugElement) {
      button.nativeElement.click();
      fixture.detectChanges();
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestLaunchVoteComponent
      ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
      ],
      providers: [
        {provide: VoteManagerService, useClass: Mock.VoteManagerService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TestLaunchVoteComponent);
        fixture.detectChanges();
        page = new Page();
      });
  }));

  describe('User Interface', () => {
    describe('Topic Input box', () => {
      it('should exist', () => {
        expect(page.topicInput).not.toBeNull();
      });

      it('should start empty', () => {
        expect(page.topicInput.nativeElement.value).toBeFalsy();
      });

      it('should have a placeholder "Topic"', () => {
        expect(page.topicInput.nativeElement.placeholder).toEqual('Topic');
      });

      it('should be a form control', () => {
        expect(page.topicInput.attributes.formControlName).not.toBeNull();
      });

      describe('form control validity', () => {
        let ctrl: AbstractControl;

        beforeEach(() => {
          ctrl = page.form.get(page.topicInput.attributes.formControlName);
        });

        it('should be invalid when null', () => {
          expect(page.topicInput.nativeElement.value).toBeFalsy();
          expect(ctrl.valid).toEqual(false);
        });

        it('should be valid when populated', () => {
          Page.setInput(page.topicInput, mockVoteCollection.parameters.topic);
        });
      });
    });

    describe('Timeframe control group', () => {
      const msPerDay: number = 1000 * 60 * 60 * 24;
      const now: Date = new Date();
      const dayAfter = (d: Date) => new Date(d.getTime() + msPerDay);
      const dayBefore = (d: Date) => new Date(d.getTime() - msPerDay);
      let formGroup: FormGroup;

      beforeEach(() => {
        formGroup = <FormGroup> page.form.get('timeframes');
      });

      it('should have three fields', () => {
        expect(page.timeframes.length).toEqual(3);
      });

      describe('First field', () => {
        let regOpenInput: DebugElement;

        beforeEach(() => {
          regOpenInput = page.timeframes[0].query(By.css('input'));
        });

        describe('input box', () => {
          it('should exist', () => {
            expect(regOpenInput).not.toBeNull();
          });

          it('should have placeholder "Registration Opens"', () => {
            expect(regOpenInput.nativeElement.placeholder).toEqual('Registration Opens');
          });

          xit('TODO: should be initialised to the current date', () => {
            expect(regOpenInput.nativeElement.value).toEqual(now.toLocaleDateString());
          });

          it('should be disabled', () => {
            expect(regOpenInput.nativeElement.disabled).toEqual(true);
          });
        });
      });

      describe('Second field', () => {
        let regDeadlineInput: DebugElement;
        let regDeadlineToggle: DebugElement;
        let regDeadlinePicker: DebugElement;

        beforeEach(() => {
          regDeadlineInput = page.timeframes[1].query(By.css('input'));
          regDeadlineToggle = page.timeframes[1].query(By.css('mat-datepicker-toggle'));
          regDeadlinePicker = page.timeframes[1].query(By.css('mat-datepicker'));
        });

        describe('input box', () => {
          it('should exist', () => {
            expect(regDeadlineInput).not.toBeNull();
          });

          it('should have placeholder "Registration Closes"', () => {
            expect(regDeadlineInput.nativeElement.placeholder).toEqual('Registration Closes');
          });

          it('should start empty', () => {
            expect(regDeadlineInput.nativeElement.value).toBeFalsy();
          });

          it('should have a minimum value of tomorrow', () => {
            const tomorrowDate: string = dayAfter(now).toISOString().split('T')[0];
            expect(regDeadlineInput.attributes.min).toEqual(tomorrowDate);
          });

          it('should be a form control', () => {
            expect(regDeadlineInput.attributes.formControlName).not.toBeNull();
          });

          describe('form control validity', () => {
            let ctrl: AbstractControl;

            beforeEach(() => {
              ctrl = formGroup.get(regDeadlineInput.attributes.formControlName);
            });

            it('should be invalid when null', () => {
              expect(regDeadlineInput.nativeElement.value).toBeFalsy();
              expect(ctrl.valid).toEqual(false);
            });

            it('should be invalid when set to today', () => {
              Page.setInput(regDeadlineInput, now.toString());
              expect(ctrl.valid).toEqual(false);
            });

            it('should be invalid when set to yesterday', () => {
              Page.setInput(regDeadlineInput, dayBefore(now).toString());
              expect(ctrl.valid).toEqual(false);
            });

            it('should be valid when set to tomorrow', () => {
              Page.setInput(regDeadlineInput, dayAfter(now).toString());
              expect(ctrl.valid).toEqual(true);
            });
          });
        });

        describe('date picker', () => {
          it('should exist', () => {
            expect(regDeadlinePicker).not.toBeNull();
          });

          xit('TODO: should set the input box', () => {
            // I don't know how to test this but it works in the UI
          });
        });

        describe('date picker toggle', () => {
          it('should exist', () => {
            expect(regDeadlineToggle).not.toBeNull();
          });

          xit('TODO: should toggle the datepicker', () => {
            // I don't know how to test this but it works in the UI
          });
        });
      });

      describe('Third field', () => {
        let registrationDeadline: Date;
        let regDeadlineInput: DebugElement;
        let votingDeadlineInput: DebugElement;
        let votingDeadlineToggle: DebugElement;
        let votingDeadlinePicker: DebugElement;

        beforeEach(() => {
          regDeadlineInput = page.timeframes[1].query(By.css('input'));
          votingDeadlineInput = page.timeframes[2].query(By.css('input'));
          votingDeadlineToggle = page.timeframes[2].query(By.css('mat-datepicker-toggle'));
          votingDeadlinePicker = page.timeframes[2].query(By.css('mat-datepicker'));
          registrationDeadline = new Date(mockVoteCollection.timeframes.registrationDeadline);
        });

        describe('input box', () => {
          it('should exist', () => {
            expect(votingDeadlineInput).not.toBeNull();
          });

          it('should have placeholder "Voting Closes"', () => {
            expect(votingDeadlineInput.nativeElement.placeholder).toEqual('Voting Closes');
          });

          it('should start empty', () => {
            expect(votingDeadlineInput.nativeElement.value).toBeFalsy();
          });

          describe('minimum value', () => {
            describe('case: Registration deadline input box set', () => {
              it('should be the day after the Registration deadline input box', () => {
                const dayAfterDate: string = dayAfter(registrationDeadline).toISOString().split('T')[0];
                Page.setInput(regDeadlineInput, registrationDeadline.toString());
                fixture.detectChanges();
                expect(votingDeadlineInput.attributes.min).toEqual(dayAfterDate);
              });
            });

            describe('case: Registration deadline input box not set', () => {
              it('should be the day after the minimum Registration deadline', () => {
                const minRegDeadline: Date = new Date(regDeadlineInput.attributes.min);
                const dayAfterDate: string = dayAfter(minRegDeadline).toISOString().split('T')[0];
                expect(votingDeadlineInput.attributes.min).toEqual(dayAfterDate);
              });
            });
          });

          it('should be a form control', () => {
            expect(votingDeadlineInput.attributes.formControlName).not.toBeNull();
          });

          describe('form control validity', () => {
            let ctrl: AbstractControl;

            beforeEach(() => {
              ctrl = formGroup.get(votingDeadlineInput.attributes.formControlName);
            });

            it('should be invalid when null', () => {
              expect(votingDeadlineInput.nativeElement.value).toBeFalsy();
              expect(ctrl.valid).toEqual(false);
            });

            describe('case: Registration Deadline input box set', () => {

              beforeEach(() => {
                Page.setInput(regDeadlineInput, registrationDeadline.toString());
                fixture.detectChanges();
              });

              it('should be invalid when set to the registration deadline', () => {
                Page.setInput(votingDeadlineInput, registrationDeadline.toString());
                expect(ctrl.valid).toEqual(false);
              });

              it('should be invalid when set to the day after the registration deadline', () => {
                Page.setInput(votingDeadlineInput, dayAfter(registrationDeadline).toString());
                expect(ctrl.valid).toEqual(true);
              });
            });

            describe('case: Registration Deadline input box not set', () => {
              let minRegistrationDeadline: Date;

              beforeEach(() => {
                minRegistrationDeadline = new Date(regDeadlineInput.attributes.min);
              });

              it('should be invalid when set to the minimum registration deadline', () => {
                Page.setInput(votingDeadlineInput, minRegistrationDeadline.toString());
                expect(ctrl.valid).toEqual(false);
              });

              it('should be invalid when set to the day after the minimum registration deadline', () => {
                Page.setInput(votingDeadlineInput, dayAfter(minRegistrationDeadline).toString());
                expect(ctrl.valid).toEqual(true);
              });
            });
          });
        });

        describe('date picker', () => {
          it('should exist', () => {
            expect(votingDeadlinePicker).not.toBeNull();
          });

          xit('TODO: should set the input box', () => {
            // I don't know how to test this but it works in the UI
          });
        });

        describe('date picker toggle', () => {
          it('should exist', () => {
            expect(votingDeadlineToggle).not.toBeNull();
          });

          xit('TODO: should toggle the datepicker', () => {
            // I don't know how to test this but it works in the UI
          });
        });
      });
    });

    describe('New Candidate input box', () => {
      let candidates: FormArray;

      beforeEach(() => {
        candidates = <FormArray> page.form.get('candidates');
      });

      it('should exist', () => {
        expect(page.newCandidate).not.toBeNull();
      });

      it('should start empty', () => {
        expect(page.newCandidate.nativeElement.value).toBeFalsy();
      });

      it('should have a placeholder "New Candidate"', () => {
        expect(page.newCandidate.nativeElement.placeholder).toEqual('New Candidate');
      });

      describe('Enter is pressed', () => {
        describe('case: the input box is populated', () => {
          it('should create a new formgroup in the "candidates" FormArray', () => {
            expect(candidates.controls.length).toEqual(0);
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.pressEnter(page.newCandidate);
            expect(candidates.controls.length).toEqual(1);
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[1]);
            Page.pressEnter(page.newCandidate);
            expect(candidates.controls.length).toEqual(2);
          });

          it('should populate the "name" control of the new formgroup with the contents of the input box', () => {
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.pressEnter(page.newCandidate);
            const group: FormGroup = <FormGroup> candidates.controls[0];
            expect(group.get('name').value).toEqual(mockVoteCollection.parameters.candidates[0]);
          });

          it('should clear the input box', () => {
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.pressEnter(page.newCandidate);
            expect(page.newCandidate.nativeElement.value).toBeFalsy();
          });
        });

        describe('case: the input box is empty', () => {
          it('should not affect the "candidates" FormArray', () => {
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.pressEnter(page.newCandidate);
            expect(candidates.controls.length).toEqual(1);
            Page.setInput(page.newCandidate, '');
            Page.pressEnter(page.newCandidate);
            expect(candidates.controls.length).toEqual(1);
          });
        });
      });

      describe('New Candidate button (should mirror pressing Enter on the New Candidate input box)', () => {
        describe('case: the input box is populated', () => {
          it('should create a new formgroup in the "candidates" FormArray', () => {
            expect(candidates.controls.length).toEqual(0);
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.click(page.newCandidateButton);
            expect(candidates.controls.length).toEqual(1);
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[1]);
            Page.click(page.newCandidateButton);
            expect(candidates.controls.length).toEqual(2);
          });

          it('should populate the "name" control of the new formgroup with the contents of the input box', () => {
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.click(page.newCandidateButton);
            const group: FormGroup = <FormGroup> candidates.controls[0];
            expect(group.get('name').value).toEqual(mockVoteCollection.parameters.candidates[0]);
          });

          it('should clear the input box', () => {
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.click(page.newCandidateButton);
            expect(page.newCandidate.nativeElement.value).toBeFalsy();
          });
        });

        describe('case: the input box is empty', () => {
          it('should not affect the "candidates" FormArray', () => {
            Page.setInput(page.newCandidate, mockVoteCollection.parameters.candidates[0]);
            Page.click(page.newCandidateButton);
            expect(candidates.controls.length).toEqual(1);
            Page.setInput(page.newCandidate, '');
            Page.click(page.newCandidateButton);
            expect(candidates.controls.length).toEqual(1);
          });
        });
      });
    });

    describe('Candidate list', () => {

      let candidates: FormArray;

      const initialise_candidates = () => {
        mockVoteCollection.parameters.candidates.forEach(candidate => {
          Page.setInput(page.newCandidate, candidate);
          Page.pressEnter(page.newCandidate);
          fixture.detectChanges();
        });
      };

      beforeEach(() => {
        candidates = <FormArray> page.form.get('candidates');
      });

      it('should start empty', () => {
        expect(page.candidateElements.length).toEqual(0);
      });

      it('should have an element per item in the candidates FormArray', () => {
        initialise_candidates();
        expect(page.candidateElements.length).toEqual(mockVoteCollection.parameters.candidates.length);
      });

      describe('each element', () => {
        const mockValues: string[] = mockVoteCollection.parameters.candidates;
        const removeIdx: number = 1;

        beforeEach(() => {
          initialise_candidates();
        });

        it('should have an input box', () => {
          page.candidateElements.forEach(element => {
            expect(element.query(By.css('input'))).not.toBeNull();
          });
        });

        it('should initialise the input box with the "name" control in the form group', () => {
          const inputs: DebugElement[] = page.candidateElements.map(element => element.query(By.css('input')));
          inputs.forEach((input, idx) => {
            expect(input.nativeElement.value).toEqual(mockValues[idx]);
          });
        });

        it('should propogate changes from the input box back to the "name" control', () => {
          const inputs: DebugElement[] = page.candidateElements.map(element => element.query(By.css('input')));
          inputs.forEach((input, idx) => {
            const newValue: string = 'A_NEW_VALUE_' + idx;
            Page.setInput(input, newValue);
            expect(input.nativeElement.value).toEqual(newValue);
            expect(candidates.controls[idx].get('name').value).toEqual(newValue);
          });
        });

        it('should remove the element if the value is deleted', () => {
          Page.setInput(page.candidateElements[removeIdx].query(By.css('input')), '');
          const remainingValues: string[] =
            page.candidateElements.map(element => element.query(By.css('input')).nativeElement.value);
          const expectedValues: string[] = mockValues.slice(0, removeIdx).concat(mockValues.slice(removeIdx + 1));
          expect(remainingValues).toEqual(expectedValues);
        });

        it('should remove the corresponding control if the value is deleted', () => {
          const controls: AbstractControl[] = candidates.controls.map(ctrl => ctrl); // create a shallow copy
          Page.setInput(page.candidateElements[removeIdx].query(By.css('input')), '');
          const expected: AbstractControl[] = controls.slice(0, removeIdx).concat(controls.slice(removeIdx + 1));
          expect(candidates.controls).toEqual(expected);
        });

        it('should have a button', () => {
          page.candidateElements.forEach(element => {
            expect(element.query(By.css('button'))).not.toBeNull();
          });
        });

        it('should remove the element when the button is pressed', () => {
          Page.click(page.candidateElements[removeIdx].query(By.css('button')));
          const remainingValues: string[] =
            page.candidateElements.map(element => element.query(By.css('input')).nativeElement.value);
          const expectedValues: string[] = mockValues.slice(0, removeIdx).concat(mockValues.slice(removeIdx + 1));
          expect(remainingValues).toEqual(expectedValues);
        });

        it('should remove the corresponding control in the FormArray when the button is pressed', () => {
          const controls: AbstractControl[] = candidates.controls.map(ctrl => ctrl); // create a shallow copy
          Page.click(page.candidateElements[removeIdx].query(By.css('button')));
          const expected: AbstractControl[] = controls.slice(0, removeIdx).concat(controls.slice(removeIdx + 1));
          expect(candidates.controls).toEqual(expected);
        });
      });
    });

  });

  describe('Functionality', () => {
    xdescribe('submit button', () => {
    });
  });
});

/**
 * Class to expose private values for testing purposes
 * It is more correct to confirm the functionality using only public values
 * but testing form validation is a lot easier if we can see the validators directly
 * (instead of testing their effects, which cannot be isolated,
 *  since they relevant affects are synthesised across many components )
 */
export class TestLaunchVoteComponent extends LaunchVoteComponent implements OnInit {
  public form: FormGroup;

  ngOnInit() {
    super.ngOnInit();
    this.form = this.launchVoteForm;
  }
}
