import { ICandidateTotal } from '../../ui/vote/results-component';
import { IRSAKey } from '../cryptography/rsa-key.interface';
import { address } from '../ethereum/type.mappings';

export interface IVotingContractDetails {
  index: number;
  address: IDynamicValue<address>;
  topic: IDynamicValue<string>;
  phase: IDynamicValue<string>;
  numPendingRegistrations: IDynamicValue<number>;
  key: IDynamicValue<IRSAKey>;
  candidates: IDynamicValue<string[]>;
  registration: IDynamicValue<IRegistration>;
  results: IDynamicValue<ICandidateTotal[]>;
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


