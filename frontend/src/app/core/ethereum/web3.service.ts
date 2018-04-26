import { EventEmitter } from '@angular/core';

export interface IWeb3Service {
  block$: EventEmitter<null>;
  isInjected: boolean;
  currentProvider: IWeb3Provider;
  defaultAccount: string;

  afterInjected(): Promise<void>;
}

export interface IWeb3Provider { //tslint:disable-line
}

// This should be injected from MetaMask (or through another web3 provider)
declare const web3: IWeb3;

export class Web3Service {
  /**
   * An observable corresponding to the stream of mined blocks
   */
  public block$: EventEmitter<null>;

  constructor() {
    this.initialiseBlock$();
  }

  /**
   * @returns {boolean} whether or not web3 has been injected into the current context
   */
  get isInjected(): boolean {
    return typeof web3 !== 'undefined' && web3.currentProvider;
  }

  /**
   * @returns {Promise<void>} a promise that resolves iff web3 is injected
   */
  afterInjected(): Promise<void> {
    return this.isInjected ?
      Promise.resolve() :
      Promise.reject('No web3 provider found. Please install the MetaMask extension (or another web3.js provider');
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
   * Maps block$ to the stream of blocks from web3
   */
  private initialiseBlock$() {
    this.block$ = new EventEmitter<null>();
    const filter: IFilter = web3.eth.filter('latest');
    filter.watch(() => {
      this.block$.emit();
    });
  }
}


// There is no official web3 typings file
// In the meantime, these are skeleton interfaces that cover this project
interface IWeb3 {
  currentProvider: any;
  eth: {
    defaultAccount: string;
    filter(event: string): IFilter;
  };
}

interface IFilter {
  watch(cb): void;
}


