import { Observable } from 'rxjs/Observable';

import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.constants';
import {
  IDynamicValue, ISingleRegistration,
  IVotingContractDetails,
  IVotingContractSummary, RetrievalStatus
} from '../core/vote-retrieval/vote-retreival.service.constants';
import { IVoteRetrievalService } from '../core/vote-retrieval/vote-retrieval.service';
import { Mock } from './module';

export class VoteRetrievalService implements IVoteRetrievalService {
  public static numPendingRegistrations$(reg$$: Observable<Observable<IDynamicValue<ISingleRegistration>>>):
    Observable<IDynamicValue<number>> {
    return Observable.of({status: RetrievalStatus.available, value: 0});
  }

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
        registrationAuthority: {status: RetrievalStatus.unavailable, value: null},
        key: {status: RetrievalStatus.unavailable, value: null},
        candidates: {status: RetrievalStatus.unavailable, value: null},
        registration$$: Observable.never(),
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
        registrationAuthority: {
          status: RetrievalStatus.available,
          value: Mock.AnonymousVotingContractCollections[index].voteConstants.registrationAuthority
        },
        key: {
          status: RetrievalStatus.available,
          value: Mock.AnonymousVotingContractCollections[index].parameters.registration_key
        },
        candidates: {
          status: RetrievalStatus.available,
          value: Mock.AnonymousVotingContractCollections[index].parameters.candidates
        },
        registration$$: Observable.never(),
        results: {status: RetrievalStatus.available, value: []}
      });
  }


}
