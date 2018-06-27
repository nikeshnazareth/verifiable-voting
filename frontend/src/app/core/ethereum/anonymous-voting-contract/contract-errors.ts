import { APP_CONFIG } from '../../../config';

export class AnonymousVotingContractErrors {
  static network(addr) {
    return new Error(`Unable to find the AnonymousVoting contract on the blockchain at address ${addr}. ` +
      'Ensure the address is correct ' +
      `and MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`);
  }

  static get events() {
    return new Error('Unexpected error in the AnonymousVoting contract event stream');
  }

  static get constants() {
    return new Error('Unable to retrieve the defining constants from the AnonymousVoting contract');
  }

  static get registration() {
    return new Error('Unable to register the voter');
  }

  static get vote() {
    return new Error('Unable to complete vote');
  }
}
