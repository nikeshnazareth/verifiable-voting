import { Component } from '@angular/core';

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
}
