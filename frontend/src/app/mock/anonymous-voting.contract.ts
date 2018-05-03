
import { AnonymousVotingAPI } from '../core/ethereum/anonymous-voting-contract/contract.api';

export class AnonymousVotingContract implements AnonymousVotingAPI {
  private PARAMETERS_IPFS_HASH: string;

  constructor(parameters_hash) {
    this.PARAMETERS_IPFS_HASH = parameters_hash;
  }

  parametersHash = {
    call: () => Promise.resolve(this.PARAMETERS_IPFS_HASH)
  };

  allEvents() {
    return null; // There are no events on the AnonymousVotingContract (yet)
  }
}
