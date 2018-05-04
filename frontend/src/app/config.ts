import * as VoteListing from '../../../backend/build/contracts/VoteListing.json';
import * as AnonymousVoting from '../../../backend/build/contracts/AnonymousVoting.json';

export let APP_CONFIG = {
  // infura.io provides a REST interfact at this address into an IPFS node
  ipfs: {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  },
  // contract files created by the truffle build process
  contracts: {
    vote_listing: VoteListing,
    anonymous_voting: AnonymousVoting
  },
  // network name used in error messages
  network: {
    name: 'ROPSTEN (test) network'
  },
  errors: {
    web3: new Error('No web3 provider found. Please install the MetaMask extension'),
  }
};