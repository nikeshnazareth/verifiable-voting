import { AnonymousVotingAPI } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { IContractEventStream } from '../../core/ethereum/contract.interface';
import { address } from '../../core/ethereum/type.mappings';
import { BigNumber } from '../bignumber';
import { Mock } from '../module';

export class AnonymousVotingContract implements AnonymousVotingAPI {
  private REGISTRATION_DEADLINE: number;
  private VOTING_DEADLINE: number;
  private PARAMETERS_IPFS_HASH: string;
  private ELIGIBILITY_CONTRACT: address;
  private REGISTRATION_AUTHORITY: address;
  private REGISTRATION_PHASE: number = 0;


  constructor(registrationDeadline: number,
              votingDeadline: number,
              parameters_hash: string,
              eligibility_contract: address,
              registration_authority: address) {
    this.REGISTRATION_DEADLINE = registrationDeadline;
    this.VOTING_DEADLINE = votingDeadline;
    this.PARAMETERS_IPFS_HASH = parameters_hash;
    this.ELIGIBILITY_CONTRACT = eligibility_contract;
    this.REGISTRATION_AUTHORITY = registration_authority;
  }

  currentPhase = {
    call: () => Promise.resolve(new BigNumber(this.REGISTRATION_PHASE))
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

  eligibilityContract = {
    call: () => Promise.resolve(this.ELIGIBILITY_CONTRACT)
  };

  registrationAuthority = {
    call: () => Promise.resolve(this.REGISTRATION_AUTHORITY)
  };

  // These functions create self-referential loop.
  // Mock.AnonymousVotingContractCollections is instantiated with instances of AnonymousVotingContract
  // Luckily, it will already be defined when these get is called

  get address(): address {
    return Mock.AnonymousVotingContractCollections
      .filter(collection => collection.params_hash === this.PARAMETERS_IPFS_HASH)[0]
      .address;
  }

  allEvents(): IContractEventStream {
    return Mock.AnonymousVotingContractCollections
      .filter(collection => collection.params_hash === this.PARAMETERS_IPFS_HASH)[0]
      .eventStream;
  }
}
