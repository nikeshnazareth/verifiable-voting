import * as contract from 'truffle-contract';

import { IContract } from './contract.interface';
import { address } from './type.mappings';
import { IWeb3Provider } from './web3.service';

export interface ITruffleContractWrapperService {
  wrap(definition: object): ITruffleContractAbstraction;
}

export interface ITruffleContractAbstraction {
  setProvider(p: IWeb3Provider): void;

  deployed(): Promise<IContract>;

  at(addr: address): Promise<IContract>;
}

export class TruffleContractWrapperService implements ITruffleContractWrapperService {
  wrap(definition: object): ITruffleContractAbstraction {
    return contract(definition);
  }
}


