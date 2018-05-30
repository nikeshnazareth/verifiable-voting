/**
 * A service to perform cryptographic operations
 */
import { Injectable } from '@angular/core';

export interface IRSAKey {
  modulus: string;
  public_exp: string;
}

export interface ICryptographyService {
  random: (size: number) => string;
}

@Injectable()
export class CryptographyService implements ICryptographyService {

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
}
