/**
 * A service to perform cryptographic operations
 */
import { Injectable } from '@angular/core';

import { Web3Service } from '../ethereum/web3.service';
import { ErrorService } from '../error-service/error.service';
import * as BN from 'bn.js';

export interface IRSAKey {
  modulus: string;
  public_exp: string;
}

export interface ICryptographyService {
  random: (size: number) => string;

  blind(message: string, factor: string, key: IRSAKey): string;
}

export const CryptographyServiceErrors = {
  key: (key) => new Error(`Invalid RSA key (${key.modulus}, ${key.public_exp})`)
};

@Injectable()
export class CryptographyService implements ICryptographyService {

  constructor(private web3Svc: Web3Service,
              private errSvc: ErrorService) {
  }

  /**
   * Uses the window.crypto API to generate a random base64 string
   * @param {number} size the size of the random value in bytes
   * @returns {string} a random base64 string of the specified size (4 characters per 3 bytes)
   */
  random(size: number): string {
    const buffer: Uint8Array = new Uint8Array(size);
    window.crypto.getRandomValues(buffer);
    return btoa(String.fromCharCode.apply(null, buffer));
  }

  /**
   * RSA blinds the message with the blinding factor
   * @param {string} message the message to be blinded
   * @param {string} factor the blinding factor
   * @param {IRSAKey} key the public component of the RSA key that will sign the blinded message
   * @returns {string} a hex string of the blinded message (or null if there is a problem)
   */
  blind(message: string, factor: string, key: IRSAKey): string {
    const hexRegex = /^0x[a-f0-9]*$/;
    if (!(key && hexRegex.test(key.modulus) && hexRegex.test(key.public_exp))) {
      this.errSvc.add(CryptographyServiceErrors.key(key), null);
      return null;
    }

    const messageHash: string = this.web3Svc.sha3(message);
    const factorHash: string = this.web3Svc.sha3(factor);
    if (messageHash && factorHash) {
      // convert the hex strings to BN values
      const m = new BN(messageHash.slice(2), 16);
      const f = new BN(factorHash.slice(2), 16);
      const N = new BN(key.modulus.slice(2), 16);
      const e = new BN(key.public_exp.slice(2), 16);

      // initialise the modular reduction values
      const modN = BN.mont(N);
      const f_modN = f.toRed(modN);
      const m_modN = m.toRed(modN);

      // calculate blinded = (f^e) * m mod N
      const f2e_modN = f_modN.redPow(e);
      const blinded_modN = f2e_modN.redMul(m_modN);
      const blinded = blinded_modN.fromRed();

      return '0x' + blinded.toString(16);
    } else {
      return null;
    }
  }
}
