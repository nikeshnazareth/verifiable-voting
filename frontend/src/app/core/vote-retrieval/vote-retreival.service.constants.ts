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




