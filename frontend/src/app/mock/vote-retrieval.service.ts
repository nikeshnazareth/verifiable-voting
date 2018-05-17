import { Observable } from 'rxjs/Observable';

import { IVoteRetrievalService } from '../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.api';
import {
  IVotingContractDetails,
  IVotingContractSummary
} from '../core/vote-retrieval/vote-retreival.service.constants';
import { Mock } from './module';

export class VoteRetrievalService implements IVoteRetrievalService {
  get summaries$(): Observable<IVotingContractSummary[]> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
        index: idx,
        address: collection.address,
        phase: VotePhases[0],
        topic: collection.parameters.topic
      }))
    );
  }

  detailsAtIndex$(index: number): Observable<IVotingContractDetails> {
    return Observable.of({
      index: index,
      address: Mock.AnonymousVotingContractCollections[index].address,
      phase: VotePhases[0],
      parameters: Mock.AnonymousVotingContractCollections[index].parameters
    });
  }
}
