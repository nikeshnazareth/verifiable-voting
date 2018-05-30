import { Observable } from 'rxjs/Observable';

import { IVoteManagerService, IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { IVoteTimeframes } from '../core/ethereum/vote-listing-contract/contract.service';
import { Mock } from './module';
import { address } from '../core/ethereum/type.mappings';
import { IRSAKey } from '../core/cryptography/cryptography.service';

export class VoteManagerService implements IVoteManagerService {
  deployVote$(timeframes: IVoteTimeframes, params: IVoteParameters): Observable<ITransactionReceipt> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.parameters.topic === params.topic)[0]
        .deploy_receipt
    );
  }

  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string) {
    return Observable.of(
      Mock.Voters
        .filter(voter => voter.anonymous_address === anonymousAddr)[0]
        .register_receipt
    );
  }
}
