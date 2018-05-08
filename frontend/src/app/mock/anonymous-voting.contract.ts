import { AnonymousVotingAPI } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { BigNumber } from './bignumber';

export class AnonymousVotingContract implements AnonymousVotingAPI {
  private REGISTRATION_DEADLINE: number;
  private VOTING_DEADLINE: number;
  private PARAMETERS_IPFS_HASH: string;
  private REGISTRATION_PHASE: number = 0;

  constructor(registrationDeadline: number, votingDeadline: number, parameters_hash: string) {
    this.REGISTRATION_DEADLINE = registrationDeadline;
    this.VOTING_DEADLINE = votingDeadline;
    this.PARAMETERS_IPFS_HASH = parameters_hash;
  }

  currentPhase = {
    call: () => Promise.resolve(this.REGISTRATION_PHASE)
  };

  registrationExpiration = {
    call: () => Promise.resolve(new BigNumber(this.REGISTRATION_DEADLINE))
  };

  votingExpiration = {
    call: () => Promise.resolve(new BigNumber(this.VOTING_DEADLINE))
  };

  parametersHash = {
    call: () => Promise.resolve(this.PARAMETERS_IPFS_HASH)
  };

  allEvents() {
    return null; // There are no events on the AnonymousVotingContract (yet)
  }
}
