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
      ` at ${addr} from the IPFS hash`)
  },
  format: {
    parametersHash: (params) => new Error(`Retrieved parameters (${params}) do not match the expected format`)
  }
};


