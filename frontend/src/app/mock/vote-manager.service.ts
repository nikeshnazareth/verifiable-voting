import { Observable } from 'rxjs/Observable';

import { IRSAKey } from '../core/cryptography/cryptography.service';
import { ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { address } from '../core/ethereum/type.mappings';
import { IVoteManagerService, IVoteParameters } from '../core/vote-manager/vote-manager.service';
import { Mock } from './module';

export class VoteManagerService implements IVoteManagerService {
  deployVote$(registrationDeadline: number,
              votingDeadline: number,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuthority: address): Observable<ITransactionReceipt> {
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

  voteAt$(contractAddr: address,
          registrationKey: IRSAKey,
          anonymousAddr: address,
          blindedSignature: string,
          blindingFactor: string,
          candidateIdx: number) {
    return Observable.of(
      Mock.Voters
        .filter(voter => voter.anonymous_address === anonymousAddr)[0]
        .vote_receipt
    );
  }
}
