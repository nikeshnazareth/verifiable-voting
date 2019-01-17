import { Observable } from 'rxjs/index';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.constants';
import {
  IVotingContractDetails,
  RetrievalStatus
} from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';

export interface IPhaseStatus {
  message: string;
  disabled: boolean;
}

export class VoteComponentMessages {

  static get retrieving(): string {
    return '[ Retrieving vote details. Please wait. ]';
  }

  static get unavailable(): string {
    return '[ Some details are unavailable. Please try again later. ]';
  }

  static get registrationClosed(): string {
    return '[ Registration has closed. ]';
  }

  static get votingNotOpened(): string {
    return '[ Voting has not yet opened. ]';
  }

  static pendingRegistrations(count: number): string {
    return `[ There are ${count} registrations waiting on the Registration Authority. Please try again later. ]`;
  }

  static get votingClosed(): string {
    return '[ Voting has closed. ]';
  }

  static get resultsNotFinalised(): string {
    return '[ Not Finalised. ]';
  }

  /**
   * Get the Registration status and error message corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} whether the Registration form is disabled and why
   */
  static registrationStatus(details: IVotingContractDetails): IPhaseStatus {
    const required: string [] = [
      details.phase.status,
      details.address.status,
      details.key.status
    ];

    let errMsg = null;

    if (required.includes(RetrievalStatus.retrieving)) {
      errMsg = VoteComponentMessages.retrieving;
    } else if (required.includes(RetrievalStatus.unavailable)) {
      errMsg = VoteComponentMessages.unavailable;
    } else if (details.phase.value !== VotePhases[0]) {
      errMsg = VoteComponentMessages.registrationClosed;
    }

    return errMsg ?
      {
        message: errMsg,
        disabled: true
      } :
      {
        message: null,
        disabled: false
      };
  }

  /**
   * Get the Voting status and error message corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {Observable<IPhaseStatus>} whether the Voting form is disabled and why
   */
  static votingStatus$(details: IVotingContractDetails): Observable<IPhaseStatus> {
    const required: string [] = [
      details.phase.status,
      details.address.status,
      details.key.status,
      details.candidates.status,
    ];

    return VoteRetrievalService.numPendingRegistrations$(details.registration$$)
      .map(numPending => {
        if (required.includes(RetrievalStatus.retrieving) || numPending.status === RetrievalStatus.retrieving) {
          return VoteComponentMessages.retrieving;
        }
        if (required.includes(RetrievalStatus.unavailable) || numPending.status === RetrievalStatus.unavailable) {
          return VoteComponentMessages.unavailable;
        }
        if (details.phase.value === VotePhases[0]) {
          return VoteComponentMessages.votingNotOpened;
        }
        if (details.phase.value === VotePhases[2]) {
          return VoteComponentMessages.votingClosed;
        }
        if (numPending.value > 0) {
          return VoteComponentMessages.pendingRegistrations(numPending.value);
        }
      })
      .startWith(VoteComponentMessages.retrieving)
      .map(errorMsg => errorMsg ?
        {
          message: errorMsg,
          disabled: true
        } :
        {
          message: null,
          disabled: false
        }
      );
  }

  /**
   * Get the Results status and error message corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} whether the Results form is disabled and why
   */
  static resultsStatus(details: IVotingContractDetails): IPhaseStatus {
    const required: string [] = [
      details.phase.status,
      details.results.status
    ];

    let errMsg = null;

    if (required.includes(RetrievalStatus.retrieving)) {
      errMsg = VoteComponentMessages.retrieving;
    } else if (required.includes(RetrievalStatus.unavailable)) {
      errMsg = VoteComponentMessages.unavailable;
    } else if (details.phase.value !== VotePhases[2]) {
      errMsg = VoteComponentMessages.resultsNotFinalised;
    }

    return [VoteComponentMessages.retrieving, VoteComponentMessages.unavailable].includes(errMsg) ?
      {
        message: errMsg,
        disabled: true
      } :
      {
        message: errMsg,
        disabled: false
      };
  }
}
