import { address } from '../core/ethereum/type.mappings';
import { AnonymousVotingAPI, VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { AnonymousVotingContract } from './anonymous-voting-contract/contract';
import { AnonymousVotingContractService } from './anonymous-voting-contract/contract.service';
import { IPFSService } from './ipfs.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { IVote, IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { IVoteConstants } from '../core/ethereum/vote-listing-contract/contract.service';
import { NoRestrictionContract } from './no-restriction-contract/contract';
import { ITriggerableEventStream, TriggerableEventStream } from './triggerable-event-stream';
import {
  TruffleAnonymousVotingAbstraction,
  TruffleAnonymousVotingWrapperService
} from './anonymous-voting-contract/truffle-contract-wrapper.service';
import {
  TruffleNoRestrictionAbstraction,
  TruffleNoRestrictionWrapperService
} from './no-restriction-contract/truffle-contract-wrapper.service';
import {
  TruffleVoteListingAbstraction,
  TruffleVoteListingWrapperService
} from './vote-listing-contract/truffle-contract-wrapper.service';
import { VoteListingContract } from './vote-listing-contract/contract';
import { VoteListingContractService } from './vote-listing-contract/contract.service';
import { VoteManagerService } from './vote-manager.service';
import { NoRestrictionContractService } from './no-restriction-contract/contract.service';
import { Web3Service } from './web3.service';
import { VoteRetrievalService } from './vote-retrieval.service';
import { MOCK_BLINDING } from './sample-blinding';
import { CryptographyService } from './cryptography.service';


const msPerDay: number = 1000 * 60 * 60 * 24;
// TODO: I've set this to noon because I'm in the +10 timezone, so being earlier than 10am local time
// is the previous night UTC. The fact that this is relevant implies that the date boundaries
// are not calculated correctly, which will cause issues with the minimum phase deadlines. Fix this!
const TODAY = new Date(2018, 6, 28, 12); // Noon Tau Day

export class Mock {
  // constants
  public static TODAY: Date = TODAY;
  public static VOTE_LISTING_ADDRESS: address = 'MOCK_VOTE_LISTING_ADDRESS';
  public static NO_RESTRICTION_ADDRESS: address = 'MOCK_NO_RESTRICTION_ADDRESS';
  public static BLINDING = MOCK_BLINDING;

  // generic services
  public static Web3Service = Web3Service;
  public static IPFSService = IPFSService;
  public static VoteManagerService = VoteManagerService;
  public static VoteRetrievalService = VoteRetrievalService;
  public static CryptographyService = CryptographyService;

  // contract service
  public static AnonymousVotingContractService = AnonymousVotingContractService;
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
      collection.voteConstants.eligibilityContract = Mock.NO_RESTRICTION_ADDRESS;
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
  const REGISTRATION_DEADLINE: number = TODAY.getTime() + 5 * msPerDay;
  const VOTING_DEADLINE: number = REGISTRATION_DEADLINE + 7 * msPerDay;
  const PARAMS_HASH: string = 'MOCK_PARAMETERS_IPFS_HASH_' + idx;
  const ELIGIBILITY_CONTRACT: address = 'deadbeef' + idx;
  const REGISTRATION_AUTHORITY: address = Array(40).fill(idx).join('');

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
      paramsHash: PARAMS_HASH,
      eligibilityContract: ELIGIBILITY_CONTRACT,
      registrationAuthority: REGISTRATION_AUTHORITY,
      registrationDeadline: REGISTRATION_DEADLINE,
      votingDeadline: VOTING_DEADLINE
    },
    deploy_receipt: {
      tx: 'MOCK_DEPLOY_TX_RECEIPT_' + idx
    },
    currentPhase: (idx + 11) * 11 % VotePhases.length,
    pendingRegistrations: (idx + 3) % 5,
    instance: new AnonymousVotingContract(
      REGISTRATION_DEADLINE, VOTING_DEADLINE, PARAMS_HASH, ELIGIBILITY_CONTRACT, REGISTRATION_AUTHORITY
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
