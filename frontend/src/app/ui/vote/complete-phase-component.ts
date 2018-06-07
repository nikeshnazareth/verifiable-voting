import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AbstractPhaseComponent } from './abstract-phase-component';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';

// TODO: This should be called ResultsComponent
export const CompletePhaseMessages = {
  retrieving: 'Retrieving the contract details...',
  internal: 'There is an internal consistency error preventing the display of results.' +
  ' Please inform the developers using the GitHub tab on this page',
  unavailable: 'The contract details are unavailable. Please try again later'
};


@Component({
  selector: 'vv-complete-phase',
  template: `
    <div id="register" *ngIf="ready$ | async; else unavailable">
      <div *ngFor="let candidateTotal of _tally$ | async">
        {{candidateTotal.candidate}} : {{candidateTotal.count}}
      </div>
    </div>
    <ng-template #unavailable>
      <div id="unavailable">{{message$ | async}}</div>
    </ng-template>
  `,
})
export class CompletePhaseComponent extends AbstractPhaseComponent implements OnInit {
  private _tally$: Observable<ICandidateTotal[]>;

  constructor(@Inject(VoteRetrievalService) voteRetrievalSvc: VoteRetrievalService) {
    super(voteRetrievalSvc);
  }

  ngOnInit() {
    super.ngOnInit();
    this._tally$ = this.voteDetails
      .map(details => details.parameters.candidates.map((candidate, idx) => ({
        candidate: candidate,
        count: details.votes.value[idx] === undefined ? 0 : details.votes.value[idx]
      })));
  }

  // TODO: remove this from the AbstractPhaseComponent
  createForm() {
    return null;
  }

  // TODO: remove this from the AbstractPhaseComponent
  handleSubmissions() {
    return Observable.empty();
  }

  statusMessage(voteDetails: IVotingContractDetails): string {
    // TODO: check for unavailable as well
    if (voteDetails.parameters.candidates.length === 0 || voteDetails.votes.status !== RETRIEVAL_STATUS.AVAILABLE) {
      return CompletePhaseMessages.retrieving;
    }
    if (voteDetails.parameters.candidates.length < voteDetails.votes.value.length) {
      return CompletePhaseMessages.retrieving;
    }

    return null;
  }
}

interface ICandidateTotal {
  candidate: string;
  count: number;
}
