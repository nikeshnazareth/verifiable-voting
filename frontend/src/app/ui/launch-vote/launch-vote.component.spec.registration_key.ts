import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AbstractControl, FormGroup } from '@angular/forms';

import { TestLaunchVoteComponent } from './launch-vote.component.spec';
import { DOMInteractionUtility } from '../dom-interaction-utility';

export function registration_key_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<TestLaunchVoteComponent>;
    let group: FormGroup;
    let step: DebugElement;

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      step = fixture.debugElement.queryAll(By.css('.mat-step'))[4];
      group = <FormGroup> fixture.componentInstance.form.get('registration_key');
    });

    describe('modulus', () => {
      let modulus: DebugElement;

      beforeEach(() => {
        modulus = step.queryAll(By.css('input'))[0];
      });

      it('should exist', () => {
        expect(modulus).toBeDefined();
      });

      it('should start empty', () => {
        expect(modulus.nativeElement.value).toBeFalsy();
      });

      it('should have placeholder "Modulus"', () => {
        expect(modulus.nativeElement.placeholder).toEqual('Modulus');
      });

      it('should be a form control', () => {
        expect(modulus.attributes.formControlName).toBeDefined();
      });

      describe('form control validity', () => {

        let control: AbstractControl;

        beforeEach(() => {
          control = group.get(modulus.attributes.formControlName);
        });

        it('should be invalid when set to null', () => {
          expect(modulus.nativeElement.value).toBeFalsy();
          expect(control.valid).toEqual(false);
        });

        it('should be invalid when containing non-hex characters', () => {
          nonHexValues.map(val => {
            DOMInteractionUtility.setValueOn(modulus, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(false);
          });
        });

        it('should be invalid when containing upper-case hex characters', () => {
          uppercaseHexValues.map(val => {
            DOMInteractionUtility.setValueOn(modulus, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(false);
          });
        });

        it('should be valid when containing only lower-case hex characters', () => {
          lowercaseHexValues.map(val => {
            DOMInteractionUtility.setValueOn(modulus, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(true);
          });
        });
      });
    });

    describe('exponent', () => {
      let exponent: DebugElement;

      beforeEach(() => {
        exponent = step.queryAll(By.css('input'))[1];
      });

      it('should exist', () => {
        expect(exponent).toBeDefined();
      });

      it('should start with value "10001"', () => {
        expect(exponent.nativeElement.value).toEqual('10001');
      });

      it('should have placeholder "Public Exponent"', () => {
        expect(exponent.nativeElement.placeholder).toEqual('Public Exponent');
      });

      it('should be a form control', () => {
        expect(exponent.attributes.formControlName).toBeDefined();
      });

      describe('form control validity', () => {
        let control: AbstractControl;

        beforeEach(() => {
          control = group.get(exponent.attributes.formControlName);
        });

        it('should be invalid when set to null', () => {
          DOMInteractionUtility.setValueOn(exponent, '');
          fixture.detectChanges();
          expect(exponent.nativeElement.value).toBeFalsy();
          expect(control.valid).toEqual(false);
        });

        it('should be invalid when containing non-hex characters', () => {
          nonHexValues.map(val => {
            DOMInteractionUtility.setValueOn(exponent, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(false);
          });
        });

        it('should be invalid when containing upper-case hex characters', () => {
          uppercaseHexValues.map(val => {
            DOMInteractionUtility.setValueOn(exponent, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(false);
          });
        });

        it('should be valid when containing only lower-case hex characters', () => {
          lowercaseHexValues.map(val => {
            DOMInteractionUtility.setValueOn(exponent, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(true);
          });
        });
      });
    });

    describe('registration authority address', () => {
      let regAuthAddress: DebugElement;

      beforeEach(() => {
        regAuthAddress = step.queryAll(By.css('input'))[2];
      });

      it('should exist', () => {
        expect(regAuthAddress).toBeDefined();
      });

      it('should start empty', () => {
        expect(regAuthAddress.nativeElement.value).toBeFalsy();
      });

      it('should have placeholder "Registration Authority Address"', () => {
        expect(regAuthAddress.nativeElement.placeholder).toEqual('Registration Authority Address');
      });

      it('should be a form control', () => {
        expect(regAuthAddress.attributes.formControlName).toBeDefined();
      });

      describe('form control validity', () => {
        let control: AbstractControl;

        beforeEach(() => {
          control = group.get(regAuthAddress.attributes.formControlName);
        });

        it('should be invalid when set to null', () => {
          DOMInteractionUtility.setValueOn(regAuthAddress, '');
          fixture.detectChanges();
          expect(regAuthAddress.nativeElement.value).toBeFalsy();
          expect(control.valid).toEqual(false);
        });

        it('should be invalid when containing non-hex characters', () => {
          nonHexValues.map(val => {
            DOMInteractionUtility.setValueOn(regAuthAddress, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(false);
          });
        });

        it('should be VALID when containing upper-case hex characters', () => {
          uppercaseHexValues.map(val => {
            DOMInteractionUtility.setValueOn(regAuthAddress, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(true);
          });
        });

        it('should be valid when containing only lower-case hex characters', () => {
          lowercaseHexValues.map(val => {
            DOMInteractionUtility.setValueOn(regAuthAddress, val);
            fixture.detectChanges();
            expect(control.valid).toEqual(true);
          });
        });
      });
    });
  };
}

const nonHexValues: string[] = [
  '1234g65',
  '0x12345',
  'twelve',
  'ab 1234'
];

const uppercaseHexValues: string[] = [
  'ABC1234',
  'abC1234',
];

const lowercaseHexValues: string[] = [
  '12345',
  'ab123',
  'deadbeef1337'
];
