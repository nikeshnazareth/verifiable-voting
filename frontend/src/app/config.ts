import * as AnonymousVoting from '../../../backend/build/contracts/AnonymousVoting.json';
import * as NoRestriction from '../../../backend/build/contracts/NoRestriction.json';
import * as VoteListing from '../../../backend/build/contracts/VoteListing.json';

const networkName: string = 'ROPSTEN (test) network';

export let APP_CONFIG = {
  // infura.io provides a REST interface at this address into an IPFS node
  ipfs: {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
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
