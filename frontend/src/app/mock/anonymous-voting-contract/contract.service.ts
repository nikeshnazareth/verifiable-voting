import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/never';

import { IAnonymousVotingContractService } from '../../core/ethereum/anonymous-voting-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { Mock } from '../module';

export class AnonymousVotingContractService implements IAnonymousVotingContractService {
  phaseAt$(addr: address): Observable<number> {
    return Observable.never();
  }

  paramsHashAt$(addr: address): Observable<string> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .params_hash
    );
  }

  registrationDeadlineAt$(addr: address): Observable<Date> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .timeframes
        .registrationDeadline
    )
      .map(t => new Date(t));
  }

  votingDeadlineAt$(addr: address): Observable<Date> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .timeframes
        .votingDeadline
    )
      .map(t => new Date(t))
  };
}
