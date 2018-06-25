import { APP_CONFIG } from '../../../config';

export class AnonymousVotingContractErrors {
  static network(addr) {
    return new Error(`Unable to find the AnonymousVoting contract on the blockchain at address ${addr}. ` +
      'Ensure the address is correct ' +
      `and MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`);
  }
}
