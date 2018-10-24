import { ICryptographyService } from '../core/cryptography/cryptography.service';
import { IRSAKey } from '../core/cryptography/rsa-key.interface';
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
      .vote.signed_address;
  }

  rawVerify(message: string, signature: string, key: IRSAKey): boolean {
    // we might be trying to confirm that the blind signature matches the blind address
    const collectionsMatchingBlindAddress = Mock.Voters.filter(voter => voter.blinded_address === message);
    if (collectionsMatchingBlindAddress.length > 0) {
      return collectionsMatchingBlindAddress[0].signed_blinded_address === signature;
    }
    // we might be trying to confirm that the signed address matches the anonymous address
    const colectionsMatchingAnonymousAddress = Mock.Voters.filter(voter => voter.anonymous_address === message);
    if (colectionsMatchingAnonymousAddress.length > 0) {
      return colectionsMatchingAnonymousAddress[0].vote.signed_address === signature;
    }

    return false;
  }

  rawSign(rawMessage: string, modulus: string, privateExponent: string): string {
    // we might be trying to get the get the blind signature from the blind address
    const collectionsMatchingBlindAddress = Mock.Voters.filter(voter => voter.blinded_address === rawMessage);
    if (collectionsMatchingBlindAddress.length > 0) {
      return collectionsMatchingBlindAddress[0].signed_blinded_address;
    }
    return null;
  }

  isPrivateExponent(key: IRSAKey, privateExponent: string): boolean {
    return false;
  }
}
