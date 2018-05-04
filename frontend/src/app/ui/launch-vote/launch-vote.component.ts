import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IVoteParameters, VoteManagerService } from '../../core/vote-manager/vote-manager.service';

@Component({
  selector: 'vv-launch-vote',
  template: `
    <form [formGroup]=launchVoteForm (ngSubmit)="onSubmit()">
      <mat-form-field>
        <textarea formControlName="parameters"
                  placeholder="Vote parameters"
                  matInput>
        </textarea>
      </mat-form-field>
      <div>
        <button type="submit"
                [disabled]="!launchVoteForm.valid"
                mat-raised-button
                color="primary">
          Launch
        </button>
      </div>
    </form>
  `
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

    this.voteManagerSvc.deployVote$(params)
      .subscribe(); // this completes immediately so we don't need to unsubscribe
  }

  private createForm() {
    this.launchVoteForm = this.fb.group({
      parameters: ['', Validators.required]
    });
  }
}
