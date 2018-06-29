/**
 * A service to perform cryptographic operations
 */
import { Injectable } from '@angular/core';

import * as BN from 'bn.js';
import { ErrorService } from '../error-service/error.service';
import { Web3Service } from '../ethereum/web3.service';
import { CryptographyErrors } from './cryptography-errors';
import { IRSAKey } from './rsa-key.interface';

export interface ICryptographyService {
  random: (size: number) => string;

  blind(message: string, factor: string, key: IRSAKey): string;

  unblind(blinded_signature: string, factor: string, key: IRSAKey): string;

  verify(message: string, signature: string, key: IRSAKey): boolean;

  sign(rawMessage: string, modulus: string, privateExponent: string): string;
}

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
    if (!CryptographyService.validKey(key)) {
      this.errSvc.add(CryptographyErrors.key(key), null);
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

      return `0x${blinded.toString(16)}`;
    } else {
      return null;
    }
  }

  /**
   * Unblinds the signed message with the blinding factor
   * @param {string} blinded_signature a signature over the message and blinding factor
   * @param {string} factor the blinding factor
   * @param {IRSAKey} key the public component of the RSA key that signed the blinded message
   * @returns {string} a hex string of the unblinded signed message (or null if there is a problem)
   */
  unblind(blinded_signature: string, factor: string, key: IRSAKey): string {
    if (!CryptographyService.validKey(key)) {
      this.errSvc.add(CryptographyErrors.key(key), null);
      return null;
    }

    if (!CryptographyService.isHexString(blinded_signature)) {
      this.errSvc.add(CryptographyErrors.signature(blinded_signature), null);
      return null;
    }

    const factorHash: string = this.web3Svc.sha3(factor);
    if (factorHash) {
      // convert the hex strings to BN values
      const blind_sig = new BN(blinded_signature.slice(2), 16);
      const f = new BN(factorHash.slice(2), 16);
      const N = new BN(key.modulus.slice(2), 16);

      // initialise the modular reduction values
      const modN = BN.mont(N);
      const f_modN = f.toRed(modN);
      const blind_sig_modN = blind_sig.toRed(modN);

      // the blinded signature is f * m^d mod N, where m^d is the signed message
      // remove the blinding factor by multiplying by the inverse of f
      const fInv_modN = f_modN.redInvm();
      const sig_modN = fInv_modN.redMul(blind_sig_modN);
      const sig = sig_modN.fromRed();

      return `0x${sig.toString(16)}`;
    } else {
      return null;
    }
  }

  /**
   * @param {string} rawMessage the message to be verified directly (ignoring hashing)
   * @param {string} signature the signature
   * @param {IRSAKey} key the public component of the RSA key that signed the raw message
   * @returns {boolean} whether the signature matches the raw message and key
   */
  verify(rawMessage: string, signature: string, key: IRSAKey): boolean {
    if (!CryptographyService.validKey(key)) {
      this.errSvc.add(CryptographyErrors.key(key), null);
      return false;
    }

    if (!CryptographyService.isHexString(signature)) {
      this.errSvc.add(CryptographyErrors.signature(signature), null);
      return false;
    }

    if (!CryptographyService.isHexString(rawMessage)) {
      this.errSvc.add(CryptographyErrors.rawMessage(rawMessage), null);
      return false;
    }

    // convert the hex strings to BN values
    const sig = new BN(signature.slice(2), 16);
    const N = new BN(key.modulus.slice(2), 16);
    const e = new BN(key.public_exp.slice(2), 16);

    // initialise the modular reduction values
    const modN = BN.mont(N);
    const sig_modN = sig.toRed(modN);

    // the signature is m^d mod N. Raise it to e and see if we get m back
    const m_modN = sig_modN.redPow(e);
    const calculated_message = m_modN.fromRed().toString(16);

    return `0x${calculated_message}` === rawMessage;
  }

  /**
   * @param {string} rawMessage the message to be signed directly (ignoring hashing)
   * @param {string} modulus the modulus of the RSA key
   * @param {string} privateExponent the private signing key exponent
   * @returns {string} the signature of the message or null if there is an error
   */
  sign(rawMessage: string, modulus: string, privateExponent: string): string {
    if (!CryptographyService.isHexString(rawMessage)) {
      this.errSvc.add(CryptographyErrors.rawMessage(rawMessage), null);
      return null;
    }

    if (!CryptographyService.isHexString(modulus)) {
      this.errSvc.add(CryptographyErrors.modulus(modulus), null);
      return null;
    }

    if (!CryptographyService.isHexString(privateExponent)) {
      this.errSvc.add(CryptographyErrors.privateExponent(privateExponent), null);
      return null;
    }

    // convert the hex strings to BN values
    const m = new BN(rawMessage.slice(2), 16);
    const N = new BN(modulus.slice(2), 16);
    const d = new BN(privateExponent.slice(2), 16);

    // initialise the modular reduction values
    const modN = BN.mont(N);
    const m_modN = m.toRed(modN);

    // the signature is m^d mod N
    const sig_modN = m_modN.redPow(d);
    const signature = sig_modN.fromRed().toString(16);

    return `0x${signature}`;
  }

  private static isHexString(val: string) {
    const hexRegex = /^0x[a-f0-9]*$/;
    return hexRegex.test(val);
  }

  private static validKey(key: IRSAKey) {
    return key && CryptographyService.isHexString(key.modulus) && CryptographyService.isHexString(key.public_exp);
  }
}


