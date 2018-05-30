import { TestBed } from '@angular/core/testing';
import { CryptographyService, ICryptographyService } from './cryptography.service';

describe('Service: CryptographyService', () => {
  let cryptoSvc: ICryptographyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CryptographyService
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
});
