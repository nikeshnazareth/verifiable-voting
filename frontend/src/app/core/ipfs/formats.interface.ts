import { address } from '../ethereum/type.mappings';

export interface IVoteHash {
  voter: address;
  voteHash: string;
}
