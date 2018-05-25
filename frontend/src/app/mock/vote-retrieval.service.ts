import { Observable } from 'rxjs/Observable';

import { IVoteRetrievalService } from '../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.api';
import {
  IVotingContractDetails,
  IVotingContractSummary, RETRIEVAL_STATUS
} from '../core/vote-retrieval/vote-retreival.service.constants';
import { Mock } from './module';

export class VoteRetrievalService implements IVoteRetrievalService {
  get summaries$(): Observable<IVotingContractSummary[]> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
        index: idx,
        address: collection.address,
        phase: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase],
        topic: collection.parameters.topic
      }))
    );
  }

  detailsAtIndex$(index: number): Observable<IVotingContractDetails> {
    return index == null || typeof index === 'undefined' ?
      Observable.of(UnavailableDetails) :
      Observable.of({
        index: index,
        address: Mock.AnonymousVotingContractCollections[index].address,
        phase: VotePhases[Mock.AnonymousVotingContractCollections[index].currentPhase],
        parameters: Mock.AnonymousVotingContractCollections[index].parameters,
        registrationDeadline: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: new Date(Mock.AnonymousVotingContractCollections[index].timeframes.registrationDeadline)
        },
        votingDeadline: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: new Date(Mock.AnonymousVotingContractCollections[index].timeframes.votingDeadline)
        }
      });
  }
}

const UnavailableDetails: IVotingContractDetails = {
  index: -1,
  address: RETRIEVAL_STATUS.UNAVAILABLE,
  phase: RETRIEVAL_STATUS.UNAVAILABLE,
  parameters: {
    topic: RETRIEVAL_STATUS.UNAVAILABLE,
    candidates: [],
    registration_key: {
      modulus: RETRIEVAL_STATUS.UNAVAILABLE,
      public_exp: RETRIEVAL_STATUS.UNAVAILABLE
    }
  },
  registrationDeadline: {
    status: RETRIEVAL_STATUS.UNAVAILABLE,
    value: null
  },
  votingDeadline: {
    status: RETRIEVAL_STATUS.UNAVAILABLE,
    value: null
  }
};
