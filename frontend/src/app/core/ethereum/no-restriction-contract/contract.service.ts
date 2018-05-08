import { Injectable } from '@angular/core';

import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { Web3Service } from '../web3.service';
import { ErrorService } from '../../error-service/error.service';
import { APP_CONFIG } from '../../../config';
import { address } from '../type.mappings';

export interface INoRestrictionContractService {
  address: Promise<address>;
}

export const NoRestrictionContractErrors = {
  network: new Error('Unable to find the NoRestriction contract on the blockchain. ' +
    `Ensure MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`)
};


@Injectable()
export class NoRestrictionContractService implements INoRestrictionContractService {
  private _addressPromise: Promise<address>;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {
    this._addressPromise = this._initAddressPromise();
  }

  get address(): Promise<address> {
    return this._addressPromise;
  }

  /**
   * Uses the truffle build object to find the NoRestriction contract on the injected blockchain and resolves
   * with the contract address
   * Notifies the Error Service if web3 is not injected or the NoRestriction contract does not exist
   * on the blockchain
   * @returns {Promise<address>} A promise that resolves to the NoRestriction contract address<br/>
   * or null if there is an error
   * @private
   */
  private _initAddressPromise(): Promise<address> {
    if (this.web3Svc.currentProvider) {
      const abstraction: ITruffleContractAbstraction = this.contractSvc.wrap(APP_CONFIG.contracts.no_restriction);
      abstraction.setProvider(this.web3Svc.currentProvider);
      return abstraction.deployed()
        .then(contract => contract.address)
        .catch(err => {
          this.errSvc.add(NoRestrictionContractErrors.network, err);
          return null;
        });
    } else {
      this.errSvc.add(APP_CONFIG.errors.web3, null);
      return Promise.resolve(null);
    }
  }
}

