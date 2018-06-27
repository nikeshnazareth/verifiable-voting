import { IRSAKey } from '../cryptography/rsa-key.interface';
import { address } from '../ethereum/type.mappings';

export interface IVoteHash {
  voter: address;
  voteHash: string;
}

export interface IVoteParameters {
  topic: string;
  candidates: string[];
  registration_key: IRSAKey;
}

export interface IBlindedAddress {
  blinded_address: string;
}

export interface IBlindSignature {
  blinded_signature: string;
}

export interface IVote {
  signed_address: string;
  candidateIdx: number;
}
