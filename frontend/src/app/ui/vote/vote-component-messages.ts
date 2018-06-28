import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.constants';
import {
  IVotingContractDetails,
  RetrievalStatus
} from '../../core/vote-retrieval/vote-retreival.service.constants';

export interface IPhaseStatus {
  registration: {
    message: string;
    disabled: boolean;
  };
  voting: {
    message: string;
    disabled: boolean;
  };
  results: {
    message: string;
    disabled: boolean;
  };
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
   * Get the phase status and error messages corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} which forms are disabled and why
   * @private
   */
  static status(details: IVotingContractDetails): IPhaseStatus {
    return {
      registration: {
        message: VoteComponentMessages.registrationStatus(details),
        disabled: VoteComponentMessages.registrationStatus(details) !== null
      },
      voting: {
        message: VoteComponentMessages.votingStatus(details),
        disabled: VoteComponentMessages.votingStatus(details) !== null
      },
      results: {
        message: VoteComponentMessages.resultsStatus(details),
        disabled: [VoteComponentMessages.retrieving, VoteComponentMessages.unavailable]
          .includes(VoteComponentMessages.resultsStatus(details))
      }
    };
  }

  /**
   * Get the Registration status and error message corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} whether the Registration form is disabled and why
   */
  static registrationStatus(details: IVotingContractDetails): string {
    const required: string [] = [
      details.phase.status,
      details.address.status,
      details.key.status
    ];

    if (required.includes(RetrievalStatus.retrieving)) {
      return VoteComponentMessages.retrieving;
    }
    if (required.includes(RetrievalStatus.unavailable)) {
      return VoteComponentMessages.unavailable;
    }
    if (details.phase.value !== VotePhases[0]) {
      return VoteComponentMessages.registrationClosed;
    }
    return null;
  }

  /**
   * Get the Voting status and error message corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} whether the Voting form is disabled and why
   */
  static votingStatus(details: IVotingContractDetails): string {
    const required: string [] = [
      details.phase.status,
      details.address.status,
      details.key.status,
      details.candidates.status,
      details.pendingRegistrations.status,
      details.registration.status
    ];

    if (required.includes(RetrievalStatus.retrieving)) {
      return VoteComponentMessages.retrieving;
    }
    if (required.includes(RetrievalStatus.unavailable)) {
      return VoteComponentMessages.unavailable;
    }
    if (details.phase.value === VotePhases[0]) {
      return VoteComponentMessages.votingNotOpened;
    }
    if (details.phase.value === VotePhases[2]) {
      return VoteComponentMessages.votingClosed;
    }
    if (details.pendingRegistrations.value.length > 0) {
      return VoteComponentMessages.pendingRegistrations(details.pendingRegistrations.value.length);
    }
    return null;
  }

  /**
   * Get the Results status and error message corresponding to the specified vote details
   * @param {IVotingContractDetails} details the details of the vote including retrieval status
   * @returns {IPhaseStatus} whether the Results form is disabled and why
   */
  static resultsStatus(details: IVotingContractDetails): string {
    const required: string [] = [
      details.phase.status,
      details.results.status
    ];

    if (required.includes(RetrievalStatus.retrieving)) {
      return VoteComponentMessages.retrieving;
    }
    if (required.includes(RetrievalStatus.unavailable)) {
      return VoteComponentMessages.unavailable;
    }
    if (details.phase.value !== VotePhases[2]) {
      return VoteComponentMessages.resultsNotFinalised;
    }
    return null;
  }
}


