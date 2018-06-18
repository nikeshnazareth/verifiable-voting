import { Observable } from 'rxjs/Observable';

import {
  IAnonymousVotingContractManager,
  IRegistrationHashes, IVoteHash
} from '../../core/ethereum/anonymous-voting-contract/contract-manager';
import { address } from '../../core/ethereum/type.mappings';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { IVoteConstants } from '../../core/ethereum/vote-listing-contract/contract.service';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { IAnonymousVotingContractCollection, Mock } from '../module';

export class AnonymousVotingContractManager implements IAnonymousVotingContractManager {
  private _collection$: Observable<IAnonymousVotingContractCollection>;

  constructor(addr: address) {
    const collections = Mock.AnonymousVotingContractCollections
      .filter(collection => collection.address === addr);
    this._collection$ = collections.length > 0 ? Observable.of(collections[0]) : Observable.empty();
  }

  get phase$(): Observable<number> {
    return this._collection$
      .map(collection => collection.currentPhase)
      // count up to the current phase
      .switchMap(phase =>
        Observable.range(0, phase + 1)
        // do no complete the observable unless the final phase is reached
          .concat(<Observable<number>> Observable.never())
          .take(VotePhases.length)
      );
  }

  get constants$(): Observable<IVoteConstants> {
    return this._collection$
      .map(collection => collection.voteConstants);
  }

  get registrationHashes$(): Observable<IRegistrationHashes> {
    return Observable.never();
  }

  get voteHashes$(): Observable<IVoteHash> {
    return Observable.never();
  }

  register$(voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt> {
    return this._collection$
      .map(() => Mock.Voters.filter(voter => voter.public_address === voterAddr)[0])
      .map(voter => voter.register_receipt);
  }

  vote$(anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt> {
    return this._collection$
      .map(() => Mock.Voters.filter(voter => voter.anonymous_address === anonymousAddr)[0])
      .map(voter => voter.vote_hash);
  }
}
