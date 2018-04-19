import { Component } from '@angular/core';

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
  public params: string = '';

  private launch() {
    console.log('clicked');
  }
}
