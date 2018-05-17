
import { IVoteParameters } from '../vote-manager/vote-manager.service';

export interface IVotingContractDetails {
  index: number;
  phase: string;
  parameters: IVoteParameters;
}

export interface IVotingContractSummary {
  index: number;
  phase: string;
  topic: string;
}

export const RETRIEVAL_STATUS = {
  UNAVAILABLE: 'UNAVAILABLE',
  RETRIEVING: 'RETRIEVING'
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
