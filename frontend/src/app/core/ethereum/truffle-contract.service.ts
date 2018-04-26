import * as contract from 'truffle-contract';

import { IWeb3Provider } from './web3.service';
import { IContract } from './contract.interfaces';

export interface ITruffleContractService {
  wrap(definition: object): ITruffleContractAbstraction;
}

export interface ITruffleContractAbstraction {
  setProvider(p: IWeb3Provider);

  deployed(): Promise<IContract>;
}

export class TruffleContractService {
  wrap(definition: object): ITruffleContractAbstraction {
    return contract(definition);
  }
}


