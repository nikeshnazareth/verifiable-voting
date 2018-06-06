import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/never';

import { IAnonymousVotingContractService } from '../../core/ethereum/anonymous-voting-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
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
      .map(t => new Date(t));
  }

  pendingRegistrationsAt$(addr: address): Observable<number> {
    return Observable.of(0)
      .concat(<Observable<number>> Observable.never());
  }

  blindSignatureHashAt$(contractAddr: address, publicVoterAddr: address): Observable<string> {
    return Observable.of(
      Mock.Voters
        .filter(voter => voter.public_address === publicVoterAddr)[0]
        .signed_blinded_address_hash
    );
  }

  registerAt$(contractAddr: address, voterAddr: address, blindedAddressHash: string): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.Voters
        .filter(voter => voter.public_address === voterAddr)[0]
        .register_receipt
    );
  }

  voteAt$(contractAddr: address, anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.Voters
        .filter(voter => voter.anonymous_address === anonymousAddr)[0]
        .vote_receipt
    );
  }
}
