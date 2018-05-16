import { INoRestrictionContractService } from '../../core/ethereum/no-restriction-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { Mock } from '../module';

export class NoRestrictionContractService implements INoRestrictionContractService {

  get address(): Promise<address> {
    return Promise.resolve(Mock.NO_RESTRICTION_ADDRESS);
  }

}
