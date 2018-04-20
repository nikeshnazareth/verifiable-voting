import { Component } from '@angular/core';
import { IPFSService } from '../../core/ipfs/ipfs.service';

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

  public constructor(private ipfsSvc: IPFSService) {
  }

  private launch() {
    this.ipfsSvc.addJSON({parameters: this.params})
      .then(hash => this.ipfsSvc.catJSON(hash))
      .then(result => console.log('Successfully added parameters to IPFS:', result))
      .catch(error => console.log('Error'));
  }
}
