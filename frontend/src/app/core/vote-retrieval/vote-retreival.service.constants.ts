import { IVoteParameters } from '../vote-manager/vote-manager.service';
import { address } from '../ethereum/type.mappings';
import { IRSAKey } from '../cryptography/cryptography.service';

export interface IVotingContractDetails {
  index: number;
  address: address;
  phase: string;
  parameters: IVoteParameters;
  registrationDeadline: IDynamicValue<Date>;
  votingDeadline: IDynamicValue<Date>;
  pendingRegistrations: IDynamicValue<number>;
  votes: IDynamicValue<number[]>;
}

export interface IReplacementVotingContractDetails {
  index: number;
  address: IDynamicValue<address>;
  topic: IDynamicValue<string>;
  phase: IDynamicValue<string>;
  numPendingRegistrations: IDynamicValue<number>;
  key: IDynamicValue<IRSAKey>;
  candidates: IDynamicValue<string[]>;
  registration: IDynamicValue<IRegistration>;
}

export interface IVotingContractSummary {
  index: number;
  address: IDynamicValue<address>;
  topic: IDynamicValue<string>;
  phase: IDynamicValue<string>;
}

export interface IRegistration {
  [voter: string]: {
    blindSignature: string
  };
}

export interface IDynamicValue<T> {
  status: string;
  value: T;
}

export const RETRIEVAL_STATUS = {
  RETRIEVING: 'RETRIEVING...',
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE'
};

export const VoteRetrievalServiceErrors = {
  ipfs: {
    getParameters: (addr) => new Error('Unable to retrieve the parameters for the AnonymousVoting contract' +
      ` at ${addr} from the IPFS hash`),
    getBlindSignature: (contract, voter) => new Error(`Unable to retrieve the blind signature for the voter ${voter}` +
      ` at the AnonymousVoting contract at ${contract} from the IPFS hash`),
    getVote: (addr) => new Error(`Unable to retrieve the votes for the AnonymousVoting contract at ${addr}` +
      ' from the IPFS hashes'),
    nullHash: new Error('Attempting to retrieve null IPFS hash'),
    retrieval: new Error('Unable to retrieve the object from IPFS')
  },
  format: {
    parameters: (params) => new Error(`Retrieved parameters object (${params}) does not match the expected format`),
    blindedAddress: (blindedAddress) => new Error(`Retrieved blinded address (${blindedAddress} does not match the expected format`),
    blindSignature: (sig) => new Error(`Retrieved blind signature (${sig} does not match the expected format`),
    vote: (vote) => new Error(`Retrieved vote (${vote}) does not match the expected format`)
  },
  registration: new Error('There was an inconsistency during registration preventing the vote from continuing')
};


