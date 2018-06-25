import { AnonymousVotingAPI } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { IContractEventStream } from '../../core/ethereum/contract.interface';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { address } from '../../core/ethereum/type.mappings';
import { BigNumber } from '../bignumber';
import { Mock } from '../module';

export class AnonymousVotingContract implements AnonymousVotingAPI {
  private regDeadline: number;
  private voteDeadline: number;
  private paramsIPFSHash: string;
  private eligibility: address;
  private regAuthority: address;

  constructor(registrationDeadline: number,
              votingDeadline: number,
              parameters_hash: string,
              eligibility_contract: address,
              registration_authority: address) {
    this.regDeadline = registrationDeadline;
    this.voteDeadline = votingDeadline;
    this.paramsIPFSHash = parameters_hash;
    this.eligibility = eligibility_contract;
    this.regAuthority = registration_authority;
  }

  get currentPhase() {
    return {
      call: () => Promise.resolve(new BigNumber(
        Mock.AnonymousVotingContractCollections
          .filter(collection => collection.voteConstants.paramsHash === this.paramsIPFSHash)[0]
          .currentPhase
      ))
    };
  }

  get registrationDeadline() {
    return {
      call: () => Promise.resolve(new BigNumber(this.regDeadline))
    };
  }

  get votingDeadline() {
    return {
      call: () => Promise.resolve(new BigNumber(this.voteDeadline))
    };
  }

  get parametersHash() {
    return {
      call: () => Promise.resolve(this.paramsIPFSHash)
    };
  }

  get eligibilityContract() {
    return {
      call: () => Promise.resolve(this.eligibility)
    };
  }

  get registrationAuthority() {
    return {
      call: () => Promise.resolve(this.regAuthority)
    };
  }

  get pendingRegistrations() {
    return {
      call: () => Promise.resolve(new BigNumber(
        Mock.AnonymousVotingContractCollections
          .filter(collection => collection.voteConstants.paramsHash === this.paramsIPFSHash)[0]
          .pendingRegistrations
      ))
    };
  }

  get blindedAddress() {
    return {
      call: (publicVoterAddr: address) => {
        const voter = Mock.Voters.filter(v => v.public_address === publicVoterAddr)[0];
        return Promise.resolve([voter.blinded_address_hash, voter.signed_blinded_address_hash]);
      }
    };
  }

  get voteHashes() {
    return {
      call: (anonymousAddr: address) => {
        return Promise.resolve(
          Mock.Voters.filter(v => v.anonymous_address === anonymousAddr)[0]
            .vote_hash
        );
      }
    };
  }

  register(_blindedAddressHash: string): Promise<ITransactionReceipt> {
    return Promise.resolve(
      Mock.Voters.filter(voter => voter.blinded_address_hash === _blindedAddressHash)[0]
        .register_receipt
    );
  }

  vote(_voteHash: string): Promise<ITransactionReceipt> {
    return Promise.resolve(
      Mock.Voters.filter(voter => voter.vote_hash === _voteHash)[0]
        .vote_receipt
    );
  }

  // These functions create self-referential loop.
  // Mock.AnonymousVotingContractCollections is instantiated with instances of AnonymousVotingContract
  // Luckily, it will already be defined when these get is called

  get address(): address {
    return Mock.AnonymousVotingContractCollections
      .filter(collection => collection.voteConstants.paramsHash === this.paramsIPFSHash)[0]
      .address;
  }

  allEvents(): IContractEventStream {
    return Mock.AnonymousVotingContractCollections
      .filter(collection => collection.voteConstants.paramsHash === this.paramsIPFSHash)[0]
      .eventStream;
  }
}
