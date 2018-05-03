import {
  ITruffleContractAbstraction,
  ITruffleContractWrapperService
} from '../core/ethereum/truffle-contract-wrapper.service';
import { IWeb3Provider } from '../core/ethereum/web3.service';
import { IContract } from '../core/ethereum/contract.interface';
import { address } from '../core/ethereum/type.mappings';
import { Mock } from './module';

export class TruffleAnonymousVotingWrapperService implements ITruffleContractWrapperService {
  wrap(definition: object): ITruffleContractAbstraction {
    return Mock.TruffleAnonymousVotingAbstraction;
  }
}

export class TruffleAnonymousVotingAbstraction implements ITruffleContractAbstraction {
  setProvider(p: IWeb3Provider) {
    return null;
  }

  deployed(): Promise<IContract> {
    throw new Error('Unexpected: TruffleAnonymousVotingAbstraction.deployed() was called');
  }

  at(addr: address): Promise<IContract> {
    return Promise.resolve(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .instance
    );
  }
}
