import { IVoteRetrievalService, IVotingContractSummary } from '../core/vote-retrieval/vote-retrieval.service';
import { Observable } from 'rxjs/Observable';
import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.api';
import { Mock } from './module';


export class VoteRetrievalService implements IVoteRetrievalService {
  get summaries$(): Observable<IVotingContractSummary[]> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
        index: idx,
        phase: VotePhases[0],
        topic: collection.parameters.topic
      }))
    );
  }
}
