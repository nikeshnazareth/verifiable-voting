import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

export interface IWeb3Service {
  isInjected: boolean;
  currentProvider: IWeb3Provider;
  defaultAccount$: Observable<string>;
  network$: Observable<string>;

  requestAccountAccess$(): Observable<boolean>;

  sha3(preimage: string): string;
}

export interface IWeb3Provider { //tslint:disable-line
}

// This should be injected from MetaMask (or another provider)
declare const Web3: any;
// Depending on the version, one of these should be injected from MetaMask (or another provider)
declare const web3: IWeb3;
declare const ethereum: IEthereum;

export class Web3Service implements IWeb3Service {
  private web3: IWeb3;
  private cachedNetwork$: ReplaySubject<string>;

  constructor() {
    this.web3 = this.initWeb3();
  }

  /**
   * @returns {boolean} whether or not web3 has been injected into the current context
   */
  get isInjected(): boolean {
    return this.web3 !== null;
  }

  /**
   * @returns {IWeb3Provider} the injected web3 provider (or null if there is no provider)
   */
  get currentProvider(): IWeb3Provider {
    return this.isInjected ? this.web3.currentProvider : null;
  }

  /**
   * @returns {Observable<string>} the web3 default ethereum account or null if there is
   * no provider or the user denied access
   */
  get defaultAccount$(): Observable<string> {
    return this.isInjected ?
      this.requestAccountAccess$()
        .switchMap(granted =>
          granted ?
            Observable.of(web3.eth.defaultAccount) :
            Observable.of(null)
        ) :
      Observable.of(null);
  }

  /**
   * Prompts the user to allow this site to access their MetaMask accounts.
   * If accepted, the MetaMask extension saves the result and they won't be asked again.
   * If rejected, they will be asked again the next time this function is called
   * @returns {Observable<boolean>} an observable of whether the user granted access
   */
  public requestAccountAccess$(): Observable<boolean> {
    if (typeof ethereum === 'undefined') {
      // Legacy dapp browsers always expose the accounts
      return Observable.of(true);
    }

    return Observable.fromPromise(ethereum.enable())
      .map(() => true)
      .catch(err => Observable.of(false));
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


  /**
   * @returns {IWeb3} the web3 provider, based on the objects injected into the javascript context by MetaMask
   */
  private initWeb3(): IWeb3 {
    if (typeof Web3 === 'undefined') {
      return null;
    }

    if (typeof ethereum !== 'undefined') {
      return new Web3(ethereum);
    }

    if (typeof web3 !== 'undefined' && web3.currentProvider) {
      return new Web3(web3.currentProvider);
    }

    return null;
  }


  /**
   * @returns {Observable<string>} an observable of the network name or an empty observable
   * if the network is unknown or cannot be retrieved
   */
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

interface IEthereum {
  enable: () => Promise<void>;
}

