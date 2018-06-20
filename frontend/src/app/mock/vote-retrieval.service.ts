import { Observable } from 'rxjs/Observable';

import { IVoteRetrievalService } from '../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.api';
import {
  IReplacementVotingContractDetails,
  IVotingContractDetails,
  IVotingContractSummary, RETRIEVAL_STATUS
} from '../core/vote-retrieval/vote-retreival.service.constants';
import { address } from '../core/ethereum/type.mappings';
import { Mock } from './module';

export class VoteRetrievalService implements IVoteRetrievalService {
  get summaries$(): Observable<IVotingContractSummary[]> {
    return Observable.of(
      Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
        index: idx,
        address: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.address},
        phase: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
        },
        topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic}
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
          value: new Date(Mock.AnonymousVotingContractCollections[index].voteConstants.registrationDeadline)
        },
        votingDeadline: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: new Date(Mock.AnonymousVotingContractCollections[index].voteConstants.votingDeadline)
        },
        pendingRegistrations: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: Mock.AnonymousVotingContractCollections[index].pendingRegistrations
        },
        votes: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: []
        }
      });
  }

  replacementDetailsAtIndex$(index: number): Observable<IReplacementVotingContractDetails> {
    return index === null || typeof index === 'undefined' ?
      Observable.of({
        index: index,
        address: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        topic: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        phase: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        numPendingRegistrations: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        key: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null}
      }) :
      Observable.of({
        index: index,
        address: {status: RETRIEVAL_STATUS.AVAILABLE, value: Mock.addresses[index]},
        topic: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: Mock.AnonymousVotingContractCollections[index].parameters.topic
        },
        phase: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: VotePhases[Mock.AnonymousVotingContractCollections[index].currentPhase]
        },
        numPendingRegistrations: {status: RETRIEVAL_STATUS.AVAILABLE, value: 0},
        key: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: Mock.AnonymousVotingContractCollections[index].parameters.registration_key
        }
      });
  }

  blindSignatureAt$(contractAddr: address, publicVoterAddr: address) {
    return Observable.of(
      Mock.Voters.filter(voter => voter.public_address === publicVoterAddr)[0]
        .signed_blinded_address
    );
  }
}

const UnavailableDetails: IVotingContractDetails = {
  index: null,
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
  },
  pendingRegistrations: {
    status: RETRIEVAL_STATUS.UNAVAILABLE,
    value: null
  },
  votes: {
    status: RETRIEVAL_STATUS.UNAVAILABLE,
    value: null
  }
};
