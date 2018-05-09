import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { IVoteParameters, VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { IVoteTimeframes } from '../../core/ethereum/vote-listing-contract/contract.service';

@Component({
  selector: 'vv-launch-vote',
  templateUrl: './launch-vote.component.html'
})
export class LaunchVoteComponent implements OnInit {
  private launchVoteForm: FormGroup;

  public constructor(private fb: FormBuilder,
                     private voteManagerSvc: VoteManagerService) {
  }

  ngOnInit() {
    this.createForm();
  }

  onSubmit() {
    const params: IVoteParameters = {
      parameters: this.launchVoteForm.value.parameters
    };

    // until this component is updated to include vote timeframes, just use null values
    const dummy_timeframes: IVoteTimeframes = {
      registrationDeadline: null,
      votingDeadline: null
    };
    this.voteManagerSvc.deployVote$(dummy_timeframes, params)
      .subscribe(); // this completes immediately so we don't need to unsubscribe
  }

  private createForm() {
    this.launchVoteForm = this.fb.group({
      parameters: ['', Validators.required]
    });
  }
}
