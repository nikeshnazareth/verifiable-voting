import { Observable } from 'rxjs/Observable';

import { IVoteRetrievalService } from '../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../core/ethereum/anonymous-voting-contract/contract.api';
import {
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
    return index === null || typeof index === 'undefined' ?
      Observable.of({
        index: index,
        address: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        topic: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        phase: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        numPendingRegistrations: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        key: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        candidates: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        registration: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null},
        results: {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null}
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
        },
        candidates: {
          status: RETRIEVAL_STATUS.AVAILABLE,
          value: Mock.AnonymousVotingContractCollections[index].parameters.candidates
        },
        registration: {status: RETRIEVAL_STATUS.AVAILABLE, value: {}},
        results: {status: RETRIEVAL_STATUS.AVAILABLE, value: []}
      });
  }

  blindSignatureAt$(contractAddr: address, publicVoterAddr: address) {
    return Observable.of(
      Mock.Voters.filter(voter => voter.public_address === publicVoterAddr)[0]
        .signed_blinded_address
    );
  }
}
