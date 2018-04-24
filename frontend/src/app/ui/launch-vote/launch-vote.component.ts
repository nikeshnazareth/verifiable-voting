import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { IPFSService } from '../../core/ipfs/ipfs.service';
import { EthereumService } from '../../core/ethereum/ethereum.service';


@Component({
  selector: 'vv-launch-vote',
  template: `
    <form [formGroup]=launchVoteForm (ngSubmit)="onSubmit()">
      <h2>Launch Vote</h2>
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

  public constructor(private ipfsSvc: IPFSService,
                     private ethSvc: EthereumService,
                     private fb: FormBuilder) {

    this.createForm();
  }

  ngOnInit() {
    this.createForm();
  }

  onSubmit() {
    const params = this.launchVoteForm.value.parameters;
    this.ipfsSvc.addJSON({parameters: params})
      .then(hash => this.ethSvc.deployVote(hash))
      .catch(err => console.log(err));
  }

  private createForm() {
    this.launchVoteForm = this.fb.group({
      parameters: ['', Validators.required]
    });
  }
}
