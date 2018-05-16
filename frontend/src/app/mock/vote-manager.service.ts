import { Observable } from 'rxjs/Observable';

import { IVoteManagerService, IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { IVoteTimeframes } from '../core/ethereum/vote-listing-contract/contract.service';
import { Mock } from './module';

export class VoteManagerService implements IVoteManagerService {
  deployVote$(timeframes: IVoteTimeframes, params: IVoteParameters): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.parameters.topic === params.topic)[0]
        .deploy_receipt
    );
  }
}
