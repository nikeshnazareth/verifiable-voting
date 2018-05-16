import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { ErrorService } from './core/error-service/error.service';

@Component({
  selector: 'vv-root',
  template: `
    <div class="mat-typography">
      <mat-toolbar color="primary">
        <h1>Verifiable Voting</h1>
      </mat-toolbar>
      <!-- @.disabled refers to the tab slide-in and slide-out animation -->
      <mat-tab-group [@.disabled]="true">
        <mat-tab label="Deployed Votes">
          <vv-list-votes (selectedContract$)="_voteSelected = $event"></vv-list-votes>
          <vv-vote [index]="_voteSelected"></vv-vote>
        </mat-tab>
        <mat-tab label="Create new vote">
          <vv-launch-vote></vv-launch-vote>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class AppComponent {
  private _voteSelected: number;

  constructor(private errSvc: ErrorService,
              private snackBar: MatSnackBar) {
    errSvc.error$.subscribe(err => {
      this.snackBar.open(err.friendly);
      console.log(err.friendly);
      console.log(err.detailed);
    });
  }
}
