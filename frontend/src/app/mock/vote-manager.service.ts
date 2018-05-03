import { Observable } from 'rxjs/Observable';

import { IVoteManagerService, IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { address } from '../core/ethereum/type.mappings';
import { Mock } from './module';

export class VoteManagerService implements IVoteManagerService {
  deployVote$(params: IVoteParameters): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
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
