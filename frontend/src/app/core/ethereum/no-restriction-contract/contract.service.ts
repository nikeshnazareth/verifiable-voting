import { Injectable } from '@angular/core';

import { APP_CONFIG } from '../../../config';
import { ErrorService } from '../../error-service/error.service';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { address } from '../type.mappings';
import { Web3Service } from '../web3.service';
import { NoRestrictionContractErrors } from './contract-errors';

export interface INoRestrictionContractService {
  address: Promise<address>;
}

@Injectable()
export class NoRestrictionContractService implements INoRestrictionContractService {
  private addressPromise: Promise<address>;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {
    this.addressPromise = this.initAddressPromise();
  }

  get address(): Promise<address> {
    return this.addressPromise;
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
  private initAddressPromise(): Promise<address> {
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

