import { IVoteParameters } from '../vote-manager/vote-manager.service';
import { address } from '../ethereum/type.mappings';

export interface IVotingContractDetails {
  index: number;
  address: address;
  phase: string;
  parameters: IVoteParameters;
  registrationDeadline: IDynamicValue<Date>;
  votingDeadline: IDynamicValue<Date>;
  pendingRegistrations: IDynamicValue<number>;
}

export interface IVotingContractSummary {
  index: number;
  address: address;
  phase: string;
  topic: string;
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
    getParametersHash: (addr) => new Error('Unable to retrieve the parameters for the AnonymousVoting contract' +
      ` at ${addr} from the IPFS hash`),
    getBlindSignature: (contract, voter) => new Error(`Unable to retrieve the blind signature for the voter ${voter}` +
      ` at the AnonymousVoting contract at ${contract} from the IPFS hash`)
  },
  format: {
    parameters: (params) => new Error(`Retrieved parameters object (${params}) does not match the expected format`),
    blindSignature: (sig) => new Error(`Retrieved blind signature (${sig} does not match the expected format`)
  }
};


