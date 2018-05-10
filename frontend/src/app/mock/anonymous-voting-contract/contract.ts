import { AnonymousVotingAPI } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { address } from '../../core/ethereum/type.mappings';
import { BigNumber } from '../bignumber';
import { Mock } from '../module';

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

  registrationDeadline = {
    call: () => Promise.resolve(new BigNumber(this.REGISTRATION_DEADLINE))
  };

  votingDeadline = {
    call: () => Promise.resolve(new BigNumber(this.VOTING_DEADLINE))
  };

  parametersHash = {
    call: () => Promise.resolve(this.PARAMETERS_IPFS_HASH)
  };

  // This creates a referential loop.
  // Mock.AnonymousVotingContractCollections is instantiated with instances of AnonymousVotingContract
  // Luckily, it will already be defined when this getter is called
  get address(): address {
    return Mock.AnonymousVotingContractCollections
      .filter(collection => collection.params_hash === this.PARAMETERS_IPFS_HASH)[0]
      .address;
  }

  allEvents() {
    return null; // There are no events on the AnonymousVotingContract (yet)
  }
}
