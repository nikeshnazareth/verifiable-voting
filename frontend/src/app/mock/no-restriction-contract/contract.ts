import { IContract } from '../../core/ethereum/contract.interface';
import { address } from '../../core/ethereum/type.mappings';
import { Mock } from '../module';

export class NoRestrictionContract implements IContract {
  get address(): address {
    return Mock.noRestrictionAddress;
  }

  allEvents() {
    return null; // There are no events on the NoRestrictionContract
  }
}
