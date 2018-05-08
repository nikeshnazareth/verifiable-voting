import { AnonymousVotingAPI } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { Mock } from './module';

export class AnonymousVotingContract implements AnonymousVotingAPI {
  private PARAMETERS_IPFS_HASH: string;
  private REGISTRATION_PHASE: number = 0;

  constructor(parameters_hash) {
    this.PARAMETERS_IPFS_HASH = parameters_hash;
  }

  currentPhase = {
    call: () => Promise.resolve(this.REGISTRATION_PHASE)
  };

  registrationExpiration = {
    call: () => Promise.resolve(Mock.REGISTRATION_PHASE_EXPIRATION)
  };

  votingExpiration = {
    call: () => Promise.resolve(Mock.VOTING_PHASE_EXPIRATION)
  };

  parametersHash = {
    call: () => Promise.resolve(this.PARAMETERS_IPFS_HASH)
  };

  allEvents() {
    return null; // There are no events on the AnonymousVotingContract (yet)
  }
}
