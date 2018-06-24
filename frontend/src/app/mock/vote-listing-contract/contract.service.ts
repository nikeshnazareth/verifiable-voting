import 'rxjs/add/observable/from';
import { Observable } from 'rxjs/Observable';

import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { address } from '../../core/ethereum/type.mappings';
import {
IVoteConstants,
IVoteListingContractService
} from '../../core/ethereum/vote-listing-contract/contract.service';
import { Mock } from '../module';

export class VoteListingContractService implements IVoteListingContractService {
  get deployedVotes$(): Observable<address> {
    return Observable.from(Mock.addresses);
  }

  deployVote$(voteConstants: IVoteConstants): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.voteConstants.paramsHash === voteConstants.paramsHash)[0]
        .deploy_receipt
    );
  }
}
