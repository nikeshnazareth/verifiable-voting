
// This should be injected from MetaMask (or through another web3 provider)
declare const web3: IWeb3;

// There is no official web3 typings file
// In the meantime, this is a skeleton interface that covers this project

export interface IWeb3 {
  currentProvider: any;
  eth: {
    defaultAccount: string;
  };
}

export interface IWeb3Service {
  get(): IWeb3;
}

export class Web3Service {
  get() {
    return web3;
  }
}


