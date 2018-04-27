import { Component } from '@angular/core';

import { ErrorService } from './core/error-service/error.service';

@Component({
  selector: 'vv-root',
  template: `
    <div class="mat-app-background">
      <mat-toolbar>Verifiable Voting</mat-toolbar>
      <vv-launch-vote></vv-launch-vote>
    </div>
  `
})
export class AppComponent {

  constructor(errSvc: ErrorService) {
    // TODO: do something more user friendly
    errSvc.error$.subscribe(err => {
      console.log(err);
    });
  }
}
