import { IWeb3Provider, IWeb3Service } from '../core/ethereum/web3.service';
import { Mock } from './module';

const arbitraryWeb3Provider: string = 'MOCK_WEB3_PROVIDER';
const arbitraryEthAcount: string = '0xMOCK_ETHEREUM_ACCOUNT';

export class Web3Service implements IWeb3Service {
  get isInjected(): boolean {
    return true;
  }

  get currentProvider(): IWeb3Provider {
    return this.isInjected ? arbitraryWeb3Provider : null;
  }

  get defaultAccount(): string {
    return this.isInjected ? arbitraryEthAcount : null;
  }

  sha3(preimage: string): string {
    if (preimage === Mock.blinding.message.plain) {
      return Mock.blinding.message.hash;
    }
    if (preimage === Mock.blinding.factor.plain) {
      return Mock.blinding.factor.hash;
    }
    return `HASH_OF_(${preimage})`;
  }
}


