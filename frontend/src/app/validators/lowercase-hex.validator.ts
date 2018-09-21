import { FormControl } from '@angular/forms';

export class LowercaseHexValidator {
  static validate(c: FormControl) {
    const regex = /^[0-9a-f]+$/;
    const invalidResponse = {validateLowercaseHex: {valid: false}};
    return regex.test(c.value) ? null : invalidResponse;
  }
}
