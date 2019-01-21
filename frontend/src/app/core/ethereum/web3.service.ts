import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

export interface IWeb3Service {
  isInjected: boolean;
  currentProvider: IWeb3Provider;
  defaultAccount: string;
  network$: Observable<string>;

  sha3(preimage: string): string;
}

export interface IWeb3Provider { //tslint:disable-line
}

// This should be injected from MetaMask (or through another web3 provider)
declare const web3: IWeb3;

export class Web3Service implements IWeb3Service {
  private cachedNetwork$: ReplaySubject<string>;

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
   * @returns {Observable<string>} an observable of the network name or an empty observable
   * if the network is unknown or cannot be retrieved
   */
  get network$(): Observable<string> {
    if (!this.cachedNetwork$) {
      this.cachedNetwork$ = new ReplaySubject<string>();
      this.initNetwork$().subscribe(this.cachedNetwork$);
    }
    return this.cachedNetwork$;
  }

  /**
   * @param {string} preimage the value to be hashed
   * @returns {string} the sha3 hash of the preimage as a hex string
   */
  sha3(preimage: string): string {
    return this.isInjected ? web3.sha3(preimage) : null;
  }

  private initNetwork$(): Observable<string> {
    if (!this.isInjected) {
      return Observable.empty();
    }

    // web 1.0 or later
    if (web3 && web3.eth && web3.eth.net && web3.eth.net.getNetworkType) {
      return Observable.fromPromise(web3.eth.net.getNetworkType());
    }

    // before web 1.0
    if (web3 && web3.version && web3.version.getNetwork) {
      return Observable.fromPromise(
        new Promise((resolve, reject) =>
          web3.version.getNetwork((err, netId) => err ? reject(err) : resolve(netId))
        )
      )
        .catch(err => Observable.empty())
        .map(netId => {
          switch (netId) {
            case '1':
              return 'main';
            case '2':
              return 'morden';
            case '3':
              return 'ropsten';
            case '4':
              return 'rinkeby';
            case '42':
              return 'kovan';
            default:
              return 'unknown';
          }
        });
    }

    // unknown error
    return Observable.empty();
  }
}


// There is no official web3 typings file
// In the meantime, this is a skeleton interface that covers this project
interface IWeb3 {
  currentProvider: any;
  eth: {
    defaultAccount: string;
    net: {
      getNetworkType: () => Promise<string>
    }
  };
  sha3: (preimage: string) => string;
  version: {
    getNetwork: (cb) => null
  };
}

