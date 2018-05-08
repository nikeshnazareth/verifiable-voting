import { Observable } from 'rxjs/Observable';

import { IVoteManagerService, IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { address } from '../core/ethereum/type.mappings';
import { IVoteTimeframes } from '../core/ethereum/vote-listing-contract/contract.service';
import { Mock } from './module';

export class VoteManagerService implements IVoteManagerService {
  deployVote$(timeframes: IVoteTimeframes, params: IVoteParameters): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.timeframes.registrationDeadline === timeframes.registrationDeadline)
        .filter(collection => collection.timeframes.votingDeadline === timeframes.votingDeadline)
        .filter(collection => collection.parameters.parameters === params.parameters)[0]
        .deploy_receipt
    );
  }

  getParameters$(addr: address): Observable<IVoteParameters> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.address === addr)[0]
        .parameters
    );
  }
}
