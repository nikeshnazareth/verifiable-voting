import 'rxjs/add/operator/take';

import { IReplacementAnonymousVotingContractService } from '../../core/ethereum/anonymous-voting-contract/replacement-contract.service';
import { IAnonymousVotingContractManager } from '../../core/ethereum/anonymous-voting-contract/contract-manager';
import { address } from '../../core/ethereum/type.mappings';
import { Mock } from '../module';

export class ReplacementAnonymousVotingContractService implements IReplacementAnonymousVotingContractService {
  at(addr: address): IAnonymousVotingContractManager {
    return new Mock.AnonymousVotingContractManager(addr);
  }
}

