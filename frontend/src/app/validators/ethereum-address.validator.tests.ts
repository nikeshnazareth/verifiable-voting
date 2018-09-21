/**
 * Angular does not have a mechanism to determine if a control has a particular validator.
 *
 * Therefore, instead of testing the validator in isolation, this is a suite of tests that should be
 * run on any component that uses the EthereumAddressValidator
 */
import { AbstractControl } from '@angular/forms';
import { address } from '../core/ethereum/type.mappings';
import { NON_HEX_SAMPLES, UPPERCASE_HEX_SAMPLES } from './sample-characters';

export class EthereumAddressValidatorTester {

  /**
   * Ensure the control's validity depends on conformance to the Ethereum address structure
   * @param {() => AbstractControl} getControl a function that gets the control to test
   * @param {(value) => void} setValue a function that sets the value of the corresponding element
   */
  static test(getControl: () => AbstractControl, setValue: (value) => void): void {
    const addr: address = '1234567890aabbccddee1234567890aabbccddee';
    let control: AbstractControl;

    beforeEach(() => {
      control = getControl();
    });

    it('should be invalid when set to empty', () => {
      setValue('');
      expect(control.valid).toEqual(false);
    });

    it('should be valid when containing exactly 40 hex characters', () => {
      setValue(addr);
      expect(control.valid).toEqual(true);
    });

    it('should be invalid when containing 39 hex characters', () => {
      setValue(addr.slice(1));
      expect(control.valid).toEqual(false);
    });

    it('should be invalid when containing 38 hex characters', () => {
      setValue(addr.slice(2));
      expect(control.valid).toEqual(false);
    });

    it('should be invalid when containing 41 hex characters', () => {
      setValue(addr + 'f');
      expect(control.valid).toEqual(false);
    });

    it('should be invalid when containing 42 hex characters', () => {
      setValue(addr + 'ff');
      expect(control.valid).toEqual(false);
    });

    it('should be invalid when containing non-hex characters', () => {
      NON_HEX_SAMPLES.map(sample => {
        setValue(sample + addr.slice(sample.length));
        expect(control.valid).toEqual(false);
      });
    });

    it('should be valid when containing uppercase hex characters', () => {
      UPPERCASE_HEX_SAMPLES.map(sample => {
        setValue(sample + addr.slice(sample.length));
        expect(control.valid).toEqual(true);
      });
    });
  }
}
