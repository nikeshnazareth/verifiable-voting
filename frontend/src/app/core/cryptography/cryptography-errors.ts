export class CryptographyErrors {
  static key(key) {
    return new Error(`Invalid RSA key (${key.modulus}, ${key.public_exp})`);
  }

  static modulus(modulus) {
    return new Error(`Invalid RSA modulus (${modulus})`);
  }

  static privateExponent(privateExponent) {
    return new Error('Invalid private exponent'); // don't state it explicitly (for security reasons)
  }

  static signature(sig) {
    return new Error(`Invalid signature ${sig}`);
  }

  static rawMessage(m) {
    return new Error(`Invalid raw message ${m}`);
  }
}
