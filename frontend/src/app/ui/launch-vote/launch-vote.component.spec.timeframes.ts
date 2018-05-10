
import { AbstractControl, FormGroup } from '@angular/forms';
import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { TestLaunchVoteComponent } from './launch-vote.component.spec';
import { DOMInteractionUtility } from '../dom-interaction-utility';
import { Mock } from '../../mock/module';

const msPerDay: number = 1000 * 60 * 60 * 24;
const dayAfter = (d: Date) => new Date(d.getTime() + msPerDay);
const dayBefore = (d: Date) => new Date(d.getTime() - msPerDay);

export function timeframe_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<TestLaunchVoteComponent>;
    let timeframes: DebugElement[];
    let formGroup: FormGroup;
    let now: Date;

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      const step: DebugElement = fixture.debugElement.queryAll(By.css('.mat-step'))[1];
      timeframes = step.queryAll(By.css('mat-form-field'));
      formGroup = <FormGroup> fixture.componentInstance.form.get('timeframes');
      now = new Date();
    });

    it('should have three fields', () => {
      expect(timeframes.length).toEqual(3);
    });

    describe('First field', () => {
      let regOpenInput: DebugElement;

      beforeEach(() => {
        regOpenInput = timeframes[0].query(By.css('input'));
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

        it('should be readonly', () => {
          expect(regOpenInput.attributes.readonly).toBeDefined();
        });

        it('should be a form control', () => {
          expect(regOpenInput.attributes.formControlName).toBeDefined();
        });

        describe('form control validity', () => {
          let control: AbstractControl;

          beforeEach(() => {
            control = formGroup.get(regOpenInput.attributes.formControlName);
          });

          it('should be invalid when set to null', () => {
            DOMInteractionUtility.setValueOn(regOpenInput, '');
            fixture.detectChanges();
            expect(control.valid).toEqual(false);
          });

          it('should be valid when populated', () => {
            expect(regOpenInput.nativeElement.value).toBeTruthy();
            expect(control.valid).toEqual(true);
          });
        });
      });
    });

    describe('Second field', () => {
      let regDeadlineInput: DebugElement;
      let regDeadlineToggle: DebugElement;
      let regDeadlinePicker: DebugElement;

      beforeEach(() => {
        regDeadlineInput = timeframes[1].query(By.css('input'));
        regDeadlineToggle = timeframes[1].query(By.css('mat-datepicker-toggle'));
        regDeadlinePicker = timeframes[1].query(By.css('mat-datepicker'));
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
            DOMInteractionUtility.setValueOn(regDeadlineInput, now.toString());
            fixture.detectChanges();
            expect(ctrl.valid).toEqual(false);
          });

          it('should be invalid when set to yesterday', () => {
            DOMInteractionUtility.setValueOn(regDeadlineInput, dayBefore(now).toString());
            fixture.detectChanges();
            expect(ctrl.valid).toEqual(false);
          });

          it('should be valid when set to tomorrow', () => {
            DOMInteractionUtility.setValueOn(regDeadlineInput, dayAfter(now).toString());
            fixture.detectChanges();
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
        regDeadlineInput = timeframes[1].query(By.css('input'));
        votingDeadlineInput = timeframes[2].query(By.css('input'));
        votingDeadlineToggle = timeframes[2].query(By.css('mat-datepicker-toggle'));
        votingDeadlinePicker = timeframes[2].query(By.css('mat-datepicker'));
        registrationDeadline = new Date(Mock.AnonymousVotingContractCollections[0].timeframes.registrationDeadline);
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
              DOMInteractionUtility.setValueOn(regDeadlineInput, registrationDeadline.toString());
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
              DOMInteractionUtility.setValueOn(regDeadlineInput, registrationDeadline.toString());
              fixture.detectChanges();
            });

            it('should be invalid when set to the registration deadline', () => {
              DOMInteractionUtility.setValueOn(votingDeadlineInput, registrationDeadline.toString());
              fixture.detectChanges();
              expect(ctrl.valid).toEqual(false);
            });

            it('should be invalid when set to the day after the registration deadline', () => {
              DOMInteractionUtility.setValueOn(votingDeadlineInput, dayAfter(registrationDeadline).toString());
              fixture.detectChanges();
              expect(ctrl.valid).toEqual(true);
            });
          });

          describe('case: Registration Deadline input box not set', () => {
            let minRegistrationDeadline: Date;

            beforeEach(() => {
              minRegistrationDeadline = new Date(regDeadlineInput.attributes.min);
            });

            it('should be invalid when set to the minimum registration deadline', () => {
              DOMInteractionUtility.setValueOn(votingDeadlineInput, minRegistrationDeadline.toString());
              fixture.detectChanges();
              expect(ctrl.valid).toEqual(false);
            });

            it('should be invalid when set to the day after the minimum registration deadline', () => {
              DOMInteractionUtility.setValueOn(votingDeadlineInput, dayAfter(minRegistrationDeadline).toString());
              fixture.detectChanges();
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
  };
}
