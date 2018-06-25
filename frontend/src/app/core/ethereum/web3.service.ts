export interface IWeb3Service {
  isInjected: boolean;
  currentProvider: IWeb3Provider;
  defaultAccount: string;
  sha3(preimage: string): string;
}

export interface IWeb3Provider { //tslint:disable-line
}

// This should be injected from MetaMask (or through another web3 provider)
declare const web3: IWeb3;

export const Web3ServiceErrors = {
  account: new Error('There is no ethereum account selected.' + '' +
    ' Please ensure you have signed into the Metamask extension (or another web3 provider)')
};

export class Web3Service {

  /**
   * @returns {boolean} whether or not web3 has been injected into the current context
   */
  get isInjected(): boolean {
    return typeof web3 !== 'undefined' && web3.currentProvider;
  }

  /**
   * @returns {IWeb3Provider} the injected web3 provider (or null if there is no provider)
   */
  get currentProvider(): IWeb3Provider {
    return this.isInjected ? web3.currentProvider : null;
  }

  /**
   * @returns {string} the web3 default ethereum account (or null if there is no provider)
   */
  get defaultAccount(): string {
    return this.isInjected ? web3.eth.defaultAccount : null;
  }

  /**
   * @param {string} preimage the value to be hashed
   * @returns {string} the sha3 hash of the preimage as a hex string
   */
  sha3(preimage: string): string {
    return this.isInjected ? web3.sha3(preimage) : null;
  }
}


// There is no official web3 typings file
// In the meantime, this is a skeleton interface that covers this project
interface IWeb3 {
  currentProvider: any;
  eth: {
    defaultAccount: string;
  };
  sha3: (preimage: string) => string;
}

