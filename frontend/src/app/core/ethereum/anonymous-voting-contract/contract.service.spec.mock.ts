import { IWeb3Provider, IWeb3Service } from '../web3.service';
import { ITruffleContractWrapperService, ITruffleContractAbstraction } from '../truffle-contract.service';
import { address } from '../type.mappings';
import { AnonymousVotingAPI } from './contract.api';

export namespace Mock {
  export class AnonymousVotingContract implements AnonymousVotingAPI {
    parametersHash = {
      call: () => Promise.resolve('parametersHash')
    };

    allEvents() {
      return null;
    }
  }

  export const RETURNED_CONTRACT: AnonymousVotingAPI = new AnonymousVotingContract();

  export class Web3Service implements IWeb3Service {
    get isInjected(): boolean {
      return true;
    }

    get currentProvider(): IWeb3Provider {
      return this.isInjected ? 'Some provider' : null;
    }

    get defaultAccount(): string {
      return this.isInjected ? 'default account' : null;
    }
  }

  export class TruffleContractWrapperService implements ITruffleContractWrapperService {
    wrap() {
      return null;
    }
  }

  export class TruffleContractAbstraction implements ITruffleContractAbstraction {
    setProvider(p: IWeb3Provider) {
    };

    deployed() {
      return Promise.resolve(null);
    }

    at(addr: address) {
      return Promise.resolve(RETURNED_CONTRACT);
    }
  }
}







