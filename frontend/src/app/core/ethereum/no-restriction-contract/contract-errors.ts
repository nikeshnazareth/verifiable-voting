import { APP_CONFIG } from '../../../config';

export class NoRestrictionContractErrors {
  static get network() {
    return new Error('Unable to find the NoRestriction contract on the blockchain. ' +
      `Ensure MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`);
  }
}
