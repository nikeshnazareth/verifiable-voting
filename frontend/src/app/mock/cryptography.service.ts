import { ICryptographyService, IRSAKey } from '../core/cryptography/cryptography.service';
import { Mock } from './module';

export class CryptographyService implements ICryptographyService {
  random(size: number): string {
    return Array(size).fill('X').join('');
  }

  blind(message: string, factor: string, key: IRSAKey): string {
    return Mock.Voters
      .filter(voter => voter.blinding_factor === factor)[0]
      .blinded_address;
  }

  unblind(blinded_signature: string, factor: string, key: IRSAKey): string {
    return Mock.Voters
      .filter(voter => voter.blinding_factor === factor)[0]
      .signed_anonymous_address;
  }
}
