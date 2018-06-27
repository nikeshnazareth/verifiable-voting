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
  complete: {
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
    const required = [
      details.phase.status,
      details.numPendingRegistrations.status,
      details.address.status,
      details.key.status,
      details.candidates.status,
      details.registration.status,
      details.results.status
    ];

    if (required.includes(RetrievalStatus.retrieving)) {
      return VoteComponentMessages.disableAllPanels(VoteComponentMessages.retrieving);
    }
    if (required.includes(RetrievalStatus.unavailable)) {
      return VoteComponentMessages.disableAllPanels(VoteComponentMessages.unavailable);
    }
    const status: IPhaseStatus = VoteComponentMessages.enableAllPanels();
    if (details.phase.value === VotePhases[0]) {
      status.voting.message = VoteComponentMessages.votingNotOpened;
      status.voting.disabled = true;
      status.complete.message = VoteComponentMessages.resultsNotFinalised;
    } else if (details.phase.value === VotePhases[1]) {
      status.registration.message = VoteComponentMessages.registrationClosed;
      status.registration.disabled = true;
      status.complete.message = VoteComponentMessages.resultsNotFinalised;
      if (details.numPendingRegistrations.value > 0) {
        status.voting.message = VoteComponentMessages.pendingRegistrations(details.numPendingRegistrations.value);
        status.voting.disabled = true;
      }
    } else if (details.phase.value === VotePhases[2]) {
      status.registration.message = VoteComponentMessages.registrationClosed;
      status.registration.disabled = true;
      status.voting.message = VoteComponentMessages.votingClosed;
      status.voting.disabled = true;
    }
    return status;
  }

  /**
   * @param {string} msg the message to display
   * @returns {IPhaseStatus} all expansion panels are disabled with the specified message
   */
  private static disableAllPanels(msg: string): IPhaseStatus {
    return {
      registration: {message: msg, disabled: true},
      voting: {message: msg, disabled: true},
      complete: {message: msg, disabled: true}
    };
  }

  /**
   * @returns {IPhaseStatus} all expansion panels are enabled with no messages
   */
  private static enableAllPanels(): IPhaseStatus {
    return {
      registration: {message: '', disabled: false},
      voting: {message: '', disabled: false},
      complete: {message: '', disabled: false}
    };
  }
}

