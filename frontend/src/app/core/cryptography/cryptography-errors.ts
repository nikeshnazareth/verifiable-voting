export class CryptographyErrors {
  static key(key) {
    return new Error(`Invalid RSA key (${key.modulus}, ${key.public_exp})`);
  }

  static signature(sig) {
    return new Error(`Invalid signature ${sig}`);
  }

  static rawMessage(m) {
    return new Error(`Invalid raw message ${m}`);
  }
}
