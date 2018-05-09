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

  private createForm() {
    this.launchVoteForm = this.fb.group({
      parameters: ['', Validators.required]
    });
  }
}
