import 'rxjs/add/operator/take';

import { IAnonymousVotingContractManager } from '../../core/ethereum/anonymous-voting-contract/contract-manager';
import { IAnonymousVotingContractService } from '../../core/ethereum/anonymous-voting-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { Mock } from '../module';

export class AnonymousVotingContractService implements IAnonymousVotingContractService {
  at(addr: address): IAnonymousVotingContractManager {
    return new Mock.AnonymousVotingContractManager(addr);
  }
}

