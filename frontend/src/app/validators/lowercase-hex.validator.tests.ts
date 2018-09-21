/**
 * Angular does not have a mechanism to determine if a control has a particular validator.
 *
 * Therefore, instead of testing the validator in isolation, this is a suite of tests that should be
 * run on any component that uses the LowercaseHexValidator
 */
import { AbstractControl } from '@angular/forms';
import { LOWERCASE_HEX_SAMPLES, NON_HEX_SAMPLES, UPPERCASE_HEX_SAMPLES } from './sample-characters';

export class LowercaseHexValidatorTests {
  /**
   * Ensure the control's validity depends on whether it contains only lowercase hex values
   * @param {() => AbstractControl} getControl a function that gets the control to test
   * @param {(value) => void} setValue a function that sets the value of the corresponding element
   */
  static test(getControl: () => AbstractControl, setValue: (value) => void): void {
    let control: AbstractControl;

    beforeEach(() => {
      control = getControl();
    });

    it('should be invalid when set to empty', () => {
      setValue('');
      expect(control.valid).toEqual(false);
    });

    it('should be invalid when containing non-hex characters', () => {
      NON_HEX_SAMPLES.map(sample => {
        setValue(sample);
        expect(control.valid).toEqual(false);
      });
    });

    it('should be invalid when containing upper-case hex characters', () => {
      UPPERCASE_HEX_SAMPLES.map(sample => {
        setValue(sample);
        expect(control.valid).toEqual(false);
      });
    });

    it('should be valid when containing only lower-case hex characters', () => {
      LOWERCASE_HEX_SAMPLES.map(sample => {
        setValue(sample);
        expect(control.valid).toEqual(true);
      });
    });
  }
}
