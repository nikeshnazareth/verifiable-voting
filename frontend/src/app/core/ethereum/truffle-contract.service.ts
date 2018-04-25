import * as contract from 'truffle-contract';

import { IWeb3Provider } from './web3.service';

export interface ITruffleContractService {
  wrap(definition: object): ITruffleContractAbstraction;
}

// The interface will correspond to the particular contract API
// This empty interface is simply used for code clarity
export interface IContract { //tslint:disable-line
}

export interface ITruffleContractAbstraction {
  setProvider(p: IWeb3Provider);

  deployed(): IContract;
}

export class TruffleContractService {
  wrap(definition: object): ITruffleContractAbstraction {
    return contract(definition);
  }
}


