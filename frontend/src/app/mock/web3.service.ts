import { IWeb3Provider, IWeb3Service } from '../core/ethereum/web3.service';

const ARBITRARY_WEB3_PROVIDER: string = 'MOCK_WEB3_PROVIDER';
const ARIBTRARY_ETH_ACCOUNT: string = 'MOCK_ETHEREUM_ACCOUNT';

export class Web3Service implements IWeb3Service {
  get isInjected(): boolean {
    return true;
  }

  get currentProvider(): IWeb3Provider {
    return this.isInjected ? ARBITRARY_WEB3_PROVIDER : null;
  }

  get defaultAccount(): string {
    return this.isInjected ? ARIBTRARY_ETH_ACCOUNT : null;
  }
}


