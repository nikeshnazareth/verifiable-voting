import { Component } from '@angular/core';
import { IPFSService } from '../../core/ipfs/ipfs.service';
import { EthereumService } from '../../core/ethereum/ethereum.service';

@Component({
  selector: 'vv-launch-vote',
  template: `
    <form (submit)="launch()" #launchVoteForm="ngForm">
      <h2>Launch Vote</h2>
      <mat-form-field>
        <textarea [(ngModel)]="params"
                  name="txtParams"
                  placeholder="Vote parameters"
                  matInput
                  required>
        </textarea>
      </mat-form-field>
      <div>
        <button type="submit"
                [disabled]="!launchVoteForm.form.valid"
                mat-raised-button
                color="primary">
          Launch
        </button>
      </div>
    </form>
  `
})
export class LaunchVoteComponent {
  private params: string = '';

  public constructor(private ipfsSvc: IPFSService, private ethSvc: EthereumService) {}

  private launch() {
    this.ipfsSvc.addJSON({parameters: this.params})
      .then(hash => this.ethSvc.deployVote(hash))
      .then(result => console.log('Successfully deployed vote'))
      .catch(error => console.log('Error: ', error));
  }
}
