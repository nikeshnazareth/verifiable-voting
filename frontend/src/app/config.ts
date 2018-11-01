import * as AnonymousVoting from '../../../backend/build/contracts/AnonymousVoting.json';
import * as NoRestriction from '../../../backend/build/contracts/NoRestriction.json';
import * as VoteListing from '../../../backend/build/contracts/VoteListing.json';

const networkName: string = 'ROPSTEN (test) network';

export let APP_CONFIG = {
  ipfs: {
    // my web facing IPFS node
    post: {
      protocol: 'https',
      host: 'ipfs.nikeshnazareth.com',
      endpoint: 'add',
      headers: {'Content-Type': 'application/json'}
    },
    // the public gateway
    get: {
      protocol: 'https',
      host: 'ipfs.io',
      endpoint: 'ipfs'
    }
  },
  // contract files created by the truffle build process
  contracts: {
    vote_listing: VoteListing,
    anonymous_voting: AnonymousVoting,
    no_restriction: NoRestriction
  },
  // network name used in error messages
  network: {
    name: networkName
  },
  errors: {
    web3: new Error('In order to view or participate in any votes, this website requires a connection to an Ethereum blockchain.' +
      ` Please install the MetaMask browser extension and configure it to use the ${networkName}`)
  }
};


export interface HttpEndpoint {
  protocol: string;
  host: string;
  port?: number;
  endpoint: string;
  headers?: {[name: string]: string};
}

