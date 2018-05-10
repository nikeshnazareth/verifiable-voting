import { address } from '../core/ethereum/type.mappings';
import { AnonymousVotingAPI } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { AnonymousVotingContract } from './anonymous-voting-contract/contract';
import { AnonymousVotingContractService } from './anonymous-voting-contract/contract.service';
import { ErrorService } from './error.service';
import { IPFSService } from './ipfs.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { IVoteTimeframes } from '../core/ethereum/vote-listing-contract/contract.service';
import { NoRestrictionContract } from './no-restriction-contract/contract';
import { TriggerableEventStream } from './triggerable-event-stream';
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


const msPerDay: number = 1000 * 60 * 60 * 24;
const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

export class Mock {
  // generic services
  public static Web3Service = Web3Service;
  public static ErrorService = ErrorService;
  public static IPFSService = IPFSService;
  public static VoteManagerService = VoteManagerService;

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
  public static AnonymousVotingContractCollections = range(4).map(i => generateMockVoteContract(i));
  public static NoRestrictionContract = new NoRestrictionContract();
  public static VoteListingContract = new VoteListingContract();
  public static VoteCreatedEventStream = new TriggerableEventStream();
  static get addresses(): address[] {
    return Mock.AnonymousVotingContractCollections.map(collection => collection.address);
  }

  // constants
  public static VOTE_LISTING_ADDRESS: address = 'MOCK_VOTE_LISTING_ADDRESS';
  public static NO_RESTRICTION_ADDRESS: address = 'MOCK_NO_RESTRICTION_ADDRESS';
}

export interface IAnonymousVotingContractCollection {
  address: string;
  parameters: IVoteParameters;
  timeframes: IVoteTimeframes;
  params_hash: string;
  deploy_receipt: ITransactionReceipt;
  instance: AnonymousVotingAPI;
}

function generateMockVoteContract(idx: number): IAnonymousVotingContractCollection {
  const REGISTRATION_DEADLINE: number = TODAY.getTime() + 5 * msPerDay;
  const VOTING_DEADLINE: number = REGISTRATION_DEADLINE + 7 * msPerDay;
  const PARAMS_HASH: string = 'MOCK_PARAMETERS_IPFS_HASH_' + idx;

  return {
    address: 'MOCK_ADDRESS_' + idx,
    parameters: {
      topic: 'MOCK_TOPIC_' + idx,
      candidates: [
        'MOCK_CANDIDATE_A_' + idx,
        'MOCK_CANDIDATE_B_' + idx,
        'MOCK_CANDIDATE_C_' + idx
      ],
      eligibility: 'MOCK_ELIGIBILITY_ADDRESS_' + idx,
      registration_key: {
        modulus: 'MOCK_REGISTRATION_MODULUS_' + idx,
        public_exp: 'MOCK_REGISTRATION_PUBEXP_' + idx
      }
    },
    timeframes: {
      registrationDeadline: REGISTRATION_DEADLINE,
      votingDeadline: VOTING_DEADLINE
    },
    params_hash: PARAMS_HASH,
    deploy_receipt: {
      tx: 'MOCK_DEPLOY_TX_RECEIPT_' + idx
    },
    instance: new AnonymousVotingContract(REGISTRATION_DEADLINE, VOTING_DEADLINE, PARAMS_HASH)
  };
}

function range(count: number) {
  return Array(count).fill(0).map((_, idx) => idx);
}
