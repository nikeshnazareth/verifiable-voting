import {
  ITruffleContractAbstraction,
  ITruffleContractWrapperService
} from '../../core/ethereum/truffle-contract-wrapper.service';
import { IWeb3Provider } from '../../core/ethereum/web3.service';
import { IContract } from '../../core/ethereum/contract.interface';
import { address } from '../../core/ethereum/type.mappings';
import { Mock } from '../module';

export class TruffleVoteListingWrapperService implements ITruffleContractWrapperService {
  wrap(definition: object): ITruffleContractAbstraction {
    return Mock.TruffleVoteListingAbstraction;
  }
}

export class TruffleVoteListingAbstraction implements ITruffleContractAbstraction {
  setProvider(p: IWeb3Provider) {
    return null;
  }

  deployed(): Promise<IContract> {
    return Promise.resolve(Mock.VoteListingContract);
  }

  at(addr: address): Promise<IContract> {
    throw new Error('Unexpected: TruffleVoteListingAbstraction.at() was called');
  }
}
