import { Observable } from 'rxjs/Observable';

import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.constants';
import {
  IVotingContractDetails,
  IVotingContractSummary, RetrievalStatus
} from '../core/vote-retrieval/vote-retreival.service.constants';
import { IVoteRetrievalService } from '../core/vote-retrieval/vote-retrieval.service';
import { Mock } from './module';

export class VoteRetrievalService implements IVoteRetrievalService {
  get summaries$(): Observable<IVotingContractSummary[]> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
        index: idx,
        address: {status: RetrievalStatus.available, value: collection.address},
        phase: {
          status: RetrievalStatus.available,
          value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
        },
        topic: {status: RetrievalStatus.available, value: collection.parameters.topic}
      }))
    );
  }

  detailsAtIndex$(index: number): Observable<IVotingContractDetails> {
    return index === null || typeof index === 'undefined' ?
      Observable.of({
        index: index,
        address: {status: RetrievalStatus.unavailable, value: null},
        topic: {status: RetrievalStatus.unavailable, value: null},
        phase: {status: RetrievalStatus.unavailable, value: null},
        pendingRegistrations: {status: RetrievalStatus.unavailable, value: null},
        key: {status: RetrievalStatus.unavailable, value: null},
        candidates: {status: RetrievalStatus.unavailable, value: null},
        registration: {status: RetrievalStatus.unavailable, value: null},
        results: {status: RetrievalStatus.unavailable, value: null}
      }) :
      Observable.of({
        index: index,
        address: {status: RetrievalStatus.available, value: Mock.addresses[index]},
        topic: {
          status: RetrievalStatus.available,
          value: Mock.AnonymousVotingContractCollections[index].parameters.topic
        },
        phase: {
          status: RetrievalStatus.available,
          value: VotePhases[Mock.AnonymousVotingContractCollections[index].currentPhase]
        },
        pendingRegistrations: {status: RetrievalStatus.available, value: []},
        key: {
          status: RetrievalStatus.available,
          value: Mock.AnonymousVotingContractCollections[index].parameters.registration_key
        },
        candidates: {
          status: RetrievalStatus.available,
          value: Mock.AnonymousVotingContractCollections[index].parameters.candidates
        },
        registration: {status: RetrievalStatus.available, value: {}},
        results: {status: RetrievalStatus.available, value: []}
      });
  }
}
