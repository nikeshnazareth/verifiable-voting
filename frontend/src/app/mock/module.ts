import { Web3Service } from './web3.service';
import { ErrorService } from './error.service';
import { TriggerableEventStream } from './triggerable-event-stream';
import { VoteListingContract } from './vote-listing.contract';
import {
  TruffleVoteListingAbstraction,
  TruffleVoteListingWrapperService
} from './truffle-vote-listing-wrapper.service';
import {
  TruffleAnonymousVotingAbstraction,
  TruffleAnonymousVotingWrapperService
} from './truffle-anonymous-voting-wrapper.service';
import { AnonymousVotingContract } from './anonymous-voting.contract';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { AnonymousVotingAPI } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { address } from '../core/ethereum/type.mappings';
import { VoteListingContractService } from './vote-listing-contract.service';
import { AnonymousVotingContractService } from './anonymous-voting-contract.service';
import { IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { IPFSService } from './ipfs.service';
import { VoteManagerService } from './vote-manager.service';
import { IVoteTimeframes } from '../core/ethereum/vote-listing-contract/contract.service';


export class Mock {
  // services
  public static Web3Service = Web3Service;
  public static ErrorService = ErrorService;
  public static TruffleVoteListingWrapperService = TruffleVoteListingWrapperService;
  public static TruffleAnonymousVotingWrapperService = TruffleAnonymousVotingWrapperService;
  public static VoteListingContractService = VoteListingContractService;
  public static AnonymousVotingContractService = AnonymousVotingContractService;
  public static IPFSService = IPFSService;
  public static VoteManagerService = VoteManagerService;

  // VoteListing contract
  public static MOCK_VOTE_LISTING_ADDRESS: string = 'MOCK_VOTE_LISTING_ADDRESS';
  public static TruffleVoteListingAbstraction = new TruffleVoteListingAbstraction();
  public static VoteListingContract = new VoteListingContract();
  public static VoteCreatedEventStream = new TriggerableEventStream();

  // AnonymousVoting contract
  public static AnonymousVotingContractCollections = range(4).map(i => generateMockVoteContract(i));
  public static TruffleAnonymousVotingAbstraction = new TruffleAnonymousVotingAbstraction();

  static get addresses(): address[] {
    return Mock.AnonymousVotingContractCollections.map(collection => collection.address);
  }
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
  const REGISTRATION_DEADLINE: number = 10100;
  const VOTING_DEADLINE: number = 10200;
  const PARAMS_HASH: string = 'MOCK_PARAMETERS_IPFS_HASH_' + idx;

  return {
    address: 'MOCK_ADDRESS_' + idx,
    parameters: {
      parameters: 'MOCK_PARAMETERS_' + idx
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
