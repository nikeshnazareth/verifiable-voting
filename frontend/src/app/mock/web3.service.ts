import { IWeb3Provider, IWeb3Service } from '../core/ethereum/web3.service';
import { Mock } from './module';

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

  sha3(preimage: string): string {
    if (preimage === Mock.BLINDING.message.plain) {
      return Mock.BLINDING.message.hash;
    }
    if (preimage === Mock.BLINDING.factor.plain) {
      return Mock.BLINDING.factor.hash;
    }
    return `HASH_OF_(${preimage})`;
  }
}


