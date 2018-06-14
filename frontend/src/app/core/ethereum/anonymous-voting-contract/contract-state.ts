
import { Observable } from 'rxjs/Observable';

import { AnonymousVotingAPI } from './contract.api';

export interface IAnonymousVotingContractManager {

}

export class AnonymousVotingContractManager implements IAnonymousVotingContractManager {

  constructor(contract: Observable<AnonymousVotingAPI>) {

  }
}
