import { Component } from '@angular/core';
import { MatSnackBar, SimpleSnackBar, MatSnackBarRef } from '@angular/material';

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
          <vv-list-votes (selectedContract$)="voteSelected = $event"></vv-list-votes>
          <vv-vote [index]="voteSelected"></vv-vote>
        </mat-tab>
        <mat-tab label="Create new vote">
          <vv-launch-vote></vv-launch-vote>
        </mat-tab>
        <mat-tab label="How it works">
          <vv-explanation></vv-explanation>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class AppComponent {
  public voteSelected: number;

  constructor(private errSvc: ErrorService,
              private snackBar: MatSnackBar) {
    errSvc.error$.subscribe(err => {
      const snackbarRef: MatSnackBarRef<SimpleSnackBar> = this.snackBar.open(err.friendly, 'CLOSE');
      snackbarRef.onAction().subscribe(() => snackbarRef.dismiss());
      console.log(err.friendly);
      console.log(err.detailed);
    });
  }
}
