
import { IBlindedAddress, IBlindSignature, IVote, IVoteParameters } from '../ipfs/formats.interface';
import { VoteRetrievalErrors } from './vote-retreival-errors';

export class FormatValidator {

  /**
   * @param {Object} obj the object to check
   * @returns {boolean} whether the specified object matches the IVoteParameters format
   */
  static parametersFormatError(obj: object): Error {
    const params: IVoteParameters = <IVoteParameters> obj;
    const valid: boolean =
      params &&
      params.topic && typeof params.topic === 'string' &&
      params.candidates && Array.isArray(params.candidates) &&
      params.candidates.every(el => typeof el === 'string') &&
      params.registration_key &&
      params.registration_key.modulus && typeof params.registration_key.modulus === 'string' &&
      params.registration_key.public_exp && typeof params.registration_key.public_exp === 'string';

    return valid ? null : VoteRetrievalErrors.format.parameters(params);
  }

  /**
   * Confirms the specified object matches the IBlindAddress format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   */
  static blindAddressFormatError(obj: object): Error {
    const blindAddress: IBlindedAddress = <IBlindedAddress> obj;
    const valid = blindAddress &&
      blindAddress.blinded_address && typeof blindAddress.blinded_address === 'string';
    return valid ? null : VoteRetrievalErrors.format.blindedAddress(obj);
  }

  /**
   * Confirms the specified object matches the IBlindSignature format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   */
  static blindSignatureFormatError(obj: object): Error {
    const blindSignature: IBlindSignature = <IBlindSignature> obj;
    const valid = blindSignature &&
      blindSignature.blinded_signature && typeof blindSignature.blinded_signature === 'string';
    return valid ? null : VoteRetrievalErrors.format.blindSignature(obj);
  }

  /**
   * Confirms the specified object matches the IVote format
   * @param {Object} obj the object to check
   * @returns {Error} null if the object matches or an appropriate error otherwise
   */
  static voteFormatError(obj: object): Error {
    const vote: IVote = <IVote> obj;
    const valid = vote &&
      vote.signed_address && typeof vote.signed_address === 'string' &&
      typeof vote.candidateIdx === 'number';
    return valid ? null : VoteRetrievalErrors.format.vote(obj);
  }
}
