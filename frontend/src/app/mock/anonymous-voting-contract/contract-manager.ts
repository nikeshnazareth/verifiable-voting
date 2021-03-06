import 'rxjs/add/observable/never';
import { Observable } from 'rxjs/Observable';

import {
IAnonymousVotingContractManager,
IRegistrationHashes} from '../../core/ethereum/anonymous-voting-contract/contract-manager';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.constants';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { address } from '../../core/ethereum/type.mappings';
import { IVoteConstants } from '../../core/ethereum/vote-listing-contract/contract.service';
import { IVoteHash } from '../../core/ipfs/formats.interface';
import { IAnonymousVotingContractCollection, Mock } from '../module';

export class AnonymousVotingContractManager implements IAnonymousVotingContractManager {
  private collection$: Observable<IAnonymousVotingContractCollection>;

  constructor(addr: address) {
    const collections = Mock.AnonymousVotingContractCollections
      .filter(collection => collection.address === addr);
    this.collection$ = collections.length > 0 ? Observable.of(collections[0]) : Observable.empty();
  }

  get phase$(): Observable<number> {
    return this.collection$
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
    return this.collection$
      .map(collection => collection.voteConstants);
  }

  get registrationHashes$(): Observable<Observable<IRegistrationHashes>> {
    return Observable.never();
  }

  get voteHashes$(): Observable<IVoteHash> {
    return Observable.never();
  }

  register$(voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt> {
    return this.collection$
      .map(() => Mock.Voters.filter(voter => voter.public_address === voterAddr)[0])
      .map(voter => voter.register_receipt);
  }

  completeRegistration$(voterAddr: address, blindSignatureHash: string, registrationAuthority: address) {
    return this.collection$
      .map(() => Mock.Voters.filter(voter => voter.public_address === voterAddr)[0])
      .map(voter => voter.complete_registration_receipt);
  }

  vote$(anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt> {
    return this.collection$
      .map(() => Mock.Voters.filter(voter => voter.anonymous_address === anonymousAddr)[0])
      .map(voter => voter.vote_receipt);
  }
}
