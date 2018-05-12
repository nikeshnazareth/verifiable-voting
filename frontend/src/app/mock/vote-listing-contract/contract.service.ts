import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';

import {
IVoteListingContractService,
IVoteTimeframes
} from '../../core/ethereum/vote-listing-contract/contract.service';
import { Mock } from '../module';
import { address } from '../../core/ethereum/type.mappings';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';

export class VoteListingContractService implements IVoteListingContractService {
  get deployedVotes$(): Observable<address> {
    return Observable.from(Mock.addresses);
  }

  deployVote$(timeframes: IVoteTimeframes, paramsHash: string): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.params_hash === paramsHash)[0]
        .deploy_receipt
    );
  }
}
