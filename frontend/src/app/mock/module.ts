import { AnonymousVotingAPI } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.constants';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { address } from '../core/ethereum/type.mappings';
import { IVoteConstants } from '../core/ethereum/vote-listing-contract/contract.service';
import { IVote } from '../core/ipfs/formats.interface';

import { IVoteParameters } from '../core/ipfs/formats.interface';
import { AnonymousVotingContract } from './anonymous-voting-contract/contract';
import { AnonymousVotingContractManager } from './anonymous-voting-contract/contract-manager';
import { AnonymousVotingContractService } from './anonymous-voting-contract/contract.service';
import {
  TruffleAnonymousVotingAbstraction,
  TruffleAnonymousVotingWrapperService
} from './anonymous-voting-contract/truffle-contract-wrapper.service';
import { CryptographyService } from './cryptography.service';
import { IPFSService } from './ipfs.service';
import { NoRestrictionContract } from './no-restriction-contract/contract';
import { NoRestrictionContractService } from './no-restriction-contract/contract.service';
import {
  TruffleNoRestrictionAbstraction,
  TruffleNoRestrictionWrapperService
} from './no-restriction-contract/truffle-contract-wrapper.service';
import { mockBlinding } from './sample-blinding';
import { ITriggerableEventStream, TriggerableEventStream } from './triggerable-event-stream';
import { VoteListingContract } from './vote-listing-contract/contract';
import { VoteListingContractService } from './vote-listing-contract/contract.service';
import {
  TruffleVoteListingAbstraction,
  TruffleVoteListingWrapperService
} from './vote-listing-contract/truffle-contract-wrapper.service';
import { VoteManagerService } from './vote-manager.service';
import { VoteRetrievalService } from './vote-retrieval.service';
import { Web3Service } from './web3.service';


const msPerDay: number = 1000 * 60 * 60 * 24;
const today = new Date(2018, 5, 28, 12); // Noon Tau Day

export class Mock {
  // constants
  public static voteListingAddress: address = 'MOCK_VOTE_LISTING_ADDRESS';
  public static noRestrictionAddress: address = 'MOCK_NO_RESTRICTION_ADDRESS';
  public static blinding = mockBlinding;

  // generic services
  public static Web3Service = Web3Service;
  public static IPFSService = IPFSService;
  public static VoteManagerService = VoteManagerService;
  public static VoteRetrievalService = VoteRetrievalService;
  public static CryptographyService = CryptographyService;

  // contract service
  public static AnonymousVotingContractService = AnonymousVotingContractService;
  public static AnonymousVotingContractManager = AnonymousVotingContractManager;
  public static VoteListingContractService = VoteListingContractService;
  public static NoRestrictionContractService = NoRestrictionContractService;

  // abstractions and wrappers
  public static TruffleAnonymousVotingAbstraction = new TruffleAnonymousVotingAbstraction();
  public static TruffleAnonymousVotingWrapperService = TruffleAnonymousVotingWrapperService;
  public static TruffleNoRestrictionAbstraction = new TruffleNoRestrictionAbstraction();
  public static TruffleNoRestrictionWrapperService = TruffleNoRestrictionWrapperService;
  public static TruffleVoteListingAbstraction = new TruffleVoteListingAbstraction();
  public static TruffleVoteListingWrapperService = TruffleVoteListingWrapperService;

  // instances
  public static AnonymousVotingContractCollections = range(4).map(i => generateMockVoteContract(i))
  // for now, the LaunchVote component gets the eligibility address straight from the NoRestriction contract
  // so override the values to match. This hack will be fixed when the LaunchVote component introduces options
    .map(collection => {
      collection.voteConstants.eligibilityContract = Mock.noRestrictionAddress;
      return collection;
    });
  public static Voters = range(4).map(i => generateMockVoter(i));
  public static NoRestrictionContract = new NoRestrictionContract();
  public static VoteListingContract = new VoteListingContract();
  public static VoteCreatedEventStream = new TriggerableEventStream();

  static get addresses(): address[] {
    return Mock.AnonymousVotingContractCollections.map(collection => collection.address);
  }
}

export interface IAnonymousVotingContractCollection {
  address: string;
  parameters: IVoteParameters;
  voteConstants: IVoteConstants;
  deploy_receipt: ITransactionReceipt;
  currentPhase: number;
  pendingRegistrations: number;
  instance: AnonymousVotingAPI;
  eventStream: ITriggerableEventStream;
}

function generateMockVoteContract(idx: number): IAnonymousVotingContractCollection {
  const registrationDeadline: number = today.getTime() + 5 * msPerDay;
  const votingDeadline: number = registrationDeadline + 7 * msPerDay;
  const paramsHash: string = 'MOCK_PARAMETERS_IPFS_HASH_' + idx;
  const eligibilityContract: address = 'deadbeef' + idx;
  const registrationAuthority: address = Array(40).fill(idx).join('');

  return {
    address: 'MOCK_ADDRESS_' + idx,
    parameters: {
      topic: 'MOCK_TOPIC_' + idx,
      candidates: [
        'MOCK_CANDIDATE_A_' + idx,
        'MOCK_CANDIDATE_B_' + idx,
        'MOCK_CANDIDATE_C_' + idx
      ],
      registration_key: {
        modulus: 'deadbabe' + idx,
        public_exp: '10001' + idx
      }
    },
    voteConstants: {
      paramsHash: paramsHash,
      eligibilityContract: eligibilityContract,
      registrationAuthority: registrationAuthority,
      registrationDeadline: registrationDeadline,
      votingDeadline: votingDeadline
    },
    deploy_receipt: {
      tx: 'MOCK_DEPLOY_TX_RECEIPT_' + idx
    },
    currentPhase: (idx + 11) * 11 % VotePhases.length,
    pendingRegistrations: (idx + 3) % 5,
    instance: new AnonymousVotingContract(
      registrationDeadline, votingDeadline, paramsHash, eligibilityContract, registrationAuthority
    ),
    eventStream: new TriggerableEventStream()
  };
}

export interface IVoter {
  public_address: address;
  anonymous_address: address;
  blinding_factor: string;
  blinded_address: string;
  blinded_address_hash: string;
  signed_blinded_address: string;
  signed_blinded_address_hash: string;
  register_receipt: ITransactionReceipt;
  complete_registration_receipt: ITransactionReceipt;
  vote: IVote;
  vote_hash: string;
  vote_receipt: ITransactionReceipt;
}

function generateMockVoter(idx: number): IVoter {
  return {
    public_address: Array(20).fill('A' + idx).join(''),
    anonymous_address: Array(20).fill('B' + idx).join(''),
    blinding_factor: 'MOCK_BLINDING_FACTOR_' + idx,
    blinded_address: 'MOCK_BLINDED_ADDRESS_' + idx,
    blinded_address_hash: 'MOCK_BLINDED_ADDRESS_HASH_' + idx,
    signed_blinded_address: 'MOCK_SIGNED_BLINDED_ADDRESS_' + idx,
    signed_blinded_address_hash: 'MOCK_SIGNED_BLINDED_ADDRESS_HASH_' + idx,
    register_receipt: 'MOCK_REGISTER_RECEIPT_' + idx,
    complete_registration_receipt: 'MOCK_COMPLETE_REGISTRATION_RECEIPT_' + idx,
    vote: {
      signed_address: 'MOCK_SIGNED_ADDRESS_' + idx,
      candidateIdx: (idx * 7) % 3
    },
    vote_hash: 'MOCK_VOTE_HASH_' + idx,
    vote_receipt: 'MOCK_VOTE_RECEIPT_' + idx
  };
}

function range(count: number) {
  return Array(count).fill(0).map((_, idx) => idx);
}
