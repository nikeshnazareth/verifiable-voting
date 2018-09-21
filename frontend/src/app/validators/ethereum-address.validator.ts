import { FormControl } from '@angular/forms';

export class EthereumAddressValidator {
  static validate(c: FormControl) {
    const regex = /^[0-9a-fA-F]{40}$/;
    const invalidResponse = {validateEthereumAddress: {valid: false}};
    return regex.test(c.value) ? null : invalidResponse;
  }
}
