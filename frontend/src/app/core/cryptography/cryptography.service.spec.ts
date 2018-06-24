import { TestBed } from '@angular/core/testing';

import { Mock } from '../../mock/module';
import { ErrorService } from '../error-service/error.service';
import { Web3Service } from '../ethereum/web3.service';
import { CryptographyService, ICryptographyService } from './cryptography.service';

describe('Service: CryptographyService', () => {
  let cryptoSvc: ICryptographyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CryptographyService,
        ErrorService,
        {provide: Web3Service, useClass: Mock.Web3Service}
      ]
    });
    cryptoSvc = TestBed.get(CryptographyService);
  });

  describe('method: random', () => {
    const SIZES = [500, 501, 502, 503];

    describe('base64 sanity check', () => {
      const b64Chars = /^[a-zA-Z0-9+/]*/;

      it('should return a string with 4 characters for every 3 bytes of requested random', () => {
        SIZES.map(size => {
          expect(cryptoSvc.random(size).length).toEqual(4 * Math.ceil(size / 3));
        });
      });

      it('should return 4 base64 characters for every 3 full bytes of requested random', () => {
        SIZES.map(size => {
          const random = cryptoSvc.random(size);
          const prefix = random.slice(0, Math.floor(random.length / 3));
          expect(b64Chars.test(prefix)).toEqual(true);
        });
      });

      it('a final single random byte should map to two base64 characters and two "=" characters', () => {
        SIZES.map(size => {
          if (size % 3 === 1) {
            const random = cryptoSvc.random(size);
            const suffix = random.slice(random.length - 4);
            expect(b64Chars.test(suffix.slice(0, 2))).toEqual(true);
            expect(suffix.slice(2)).toEqual('==');
          }
        });
      });

      it('a final two random bytes should map to three base64 characters and one "=" character', () => {
        SIZES.map(size => {
          if (size % 3 === 2) {
            const random = cryptoSvc.random(size);
            const suffix = random.slice(random.length - 4);
            expect(b64Chars.test(suffix.slice(0, 3))).toEqual(true);
            expect(suffix.slice(3)).toEqual('=');
          }
        });
      });
    });

    it('should be different for every call', () => {
      const random = cryptoSvc.random(SIZES[0]);
      const anotherRandom = cryptoSvc.random(SIZES[0]);
      expect(random).not.toEqual(anotherRandom);
    });
  });

  describe('method: blind', () => {
    it('should return the blinded value corresponding to the message, factor and key', () => {
      const blinded: string = cryptoSvc.blind(
        Mock.BLINDING.message.plain, Mock.BLINDING.factor.plain, Mock.BLINDING.public_key
      );
      expect(blinded).toEqual(Mock.BLINDING.blinded_message);
    });

    xdescribe('case: the key is null', () => {
    });

    xdescribe('case: the modulus is not a valid hex value', () => {
    });

    xdescribe('case: the public exponent is not a valid hex value', () => {
    });

    xdescribe('case: web3 is not injected', () => {
    });
  });

  describe('method: unblind', () => {
    it('should return the unblinded signature corresponding to the blinded signature, factor and key', () => {
      const unblinded: string = cryptoSvc.unblind(
        Mock.BLINDING.signed_blinded_message, Mock.BLINDING.factor.plain, Mock.BLINDING.public_key
      );
      expect(unblinded).toEqual(Mock.BLINDING.signed_unblinded_message);
    });

    xdescribe('case: the blinded signature is null', () => {
    });
    xdescribe('case: the blinded signature is not a valid hex value', () => {
    });

    xdescribe('case: the key is null', () => {
    });

    xdescribe('case: the modulus is not a valid hex value', () => {
    });

    xdescribe('case: the public exponent is not a valid hex value', () => {
    });

    xdescribe('case: web3 is not injected', () => {
    });
  });

  describe('method: signature', () => {
    it('should return true when comparing the blinded message to the unblinded message', () => {
      const verify: boolean = cryptoSvc.verify(
        Mock.BLINDING.blinded_message, Mock.BLINDING.signed_blinded_message, Mock.BLINDING.public_key
      );
      expect(verify).toEqual(true);
    });

    it('should return true when comparing the hashed message to the signed unblinded message', () => {
      const verify: boolean = cryptoSvc.verify(
        Mock.BLINDING.message.hash, Mock.BLINDING.signed_unblinded_message, Mock.BLINDING.public_key
      );
      expect(verify).toEqual(true);
    });

    xit('should return false in other cases');

    xdescribe('case: the raw message is null', () => {
    });

    xdescribe('case: the raw message is not a valid hex value', () => {});

    xdescribe('case: signature is null', () => {});

    xdescribe('case: the signature is not a valid hex value', () => {});

    xdescribe('case: the key is null', () => {});

    xdescribe('case: the modulus is not a valid hex value', () => {
    });

    xdescribe('case: the public exponent is not a valid hex value', () => {
    });
  });
});
