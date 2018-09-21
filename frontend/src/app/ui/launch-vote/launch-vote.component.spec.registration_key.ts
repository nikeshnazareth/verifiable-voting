import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { AbstractControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { EthereumAddressValidatorTester } from '../../validators/ethereum-address.validator.tests';
import { LowercaseHexValidatorTests } from '../../validators/lowercase-hex.validator.tests';
import { LaunchVoteComponent } from './launch-vote.component';

export function registration_key_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<LaunchVoteComponent>;
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

        const setValue = (value) => {
          DOMInteractionUtility.setValueOn(modulus, value);
          fixture.detectChanges();
        };

        beforeEach(() => {
          control = group.get(modulus.attributes.formControlName);
        });

        LowercaseHexValidatorTests.test(() => control, setValue);
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

        const setValue = (value) => {
          DOMInteractionUtility.setValueOn(exponent, value);
          fixture.detectChanges();
        };

        beforeEach(() => {
          control = group.get(exponent.attributes.formControlName);
        });

        LowercaseHexValidatorTests.test(() => control, setValue);
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
        const setValue = (value) => {
          DOMInteractionUtility.setValueOn(regAuthAddress, value);
          fixture.detectChanges();
        };

        beforeEach(() => {
          control = group.get(regAuthAddress.attributes.formControlName);
        });

        EthereumAddressValidatorTester.test(() => control, setValue);
      });
    });
  };
}
