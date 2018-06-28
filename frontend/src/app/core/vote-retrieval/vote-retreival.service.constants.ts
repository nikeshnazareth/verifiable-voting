import { ICandidateTotal } from '../../ui/vote/results/results-component';
import { IRSAKey } from '../cryptography/rsa-key.interface';
import { address } from '../ethereum/type.mappings';

export interface IVotingContractDetails {
  index: number;
  address: IDynamicValue<address>;
  topic: IDynamicValue<string>;
  phase: IDynamicValue<string>;
  pendingRegistrations: IDynamicValue<ISinglePendingRegistration[]>;
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

export interface ISinglePendingRegistration {
  voter: address;
  blindedAddress: string;
}

export interface ISingleVoterRegistration {
  voter: address;
  blindedAddress: string;
  blindSignature: string;
}

export interface IDynamicValue<T> {
  status: string;
  value: T;
}

export const RetrievalStatus = {
  retrieving: 'RETRIEVING...',
  available: 'AVAILABLE',
  unavailable: 'UNAVAILABLE'
};




