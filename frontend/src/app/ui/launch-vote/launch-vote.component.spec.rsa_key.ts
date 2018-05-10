import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AbstractControl, FormGroup } from '@angular/forms';

import { TestLaunchVoteComponent } from './launch-vote.component.spec';
import { DOMInteractionUtility } from '../dom-interaction-utility';

export function rsa_key_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<TestLaunchVoteComponent>;
    let group: FormGroup;

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      group = <FormGroup> fixture.componentInstance.form.get('rsa_key');
    });

    describe('modulus', () => {
      let modulus: DebugElement;

      beforeEach(() => {
        modulus = fixture.debugElement.query(By.css('input[formControlName="modulus"]'));
      });

      it('should exist', () => {
        expect(modulus).not.toBeNull();
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
        exponent = fixture.debugElement.query(By.css('input[formControlName="exponent"]'));
      });

      it('should exist', () => {
        expect(exponent).not.toBeNull();
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
          control = group.get('exponent');
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
