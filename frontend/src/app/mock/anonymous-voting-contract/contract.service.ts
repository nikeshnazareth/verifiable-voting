import { Observable } from 'rxjs/Observable';

import { IAnonymousVotingContractService } from '../../core/ethereum/anonymous-voting-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { AnonymousVotingAPI } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { Mock } from '../module';

export class AnonymousVotingContractService implements IAnonymousVotingContractService {
  phaseAt$(addr: address): Observable<number> {
    return Observable.empty();
  }

  paramsHashAt$(addr: address): Observable<string> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .params_hash
    );
  }

  contractAt(addr: address): Observable<AnonymousVotingAPI> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .instance
    );
  }
}
