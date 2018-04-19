import { Component } from '@angular/core';

@Component({
  selector: 'vv-root',
  template: `
    <div class="mat-app-background">
      <mat-toolbar>Verifiable Voting</mat-toolbar>
      <form>
        <h2>Launch Vote</h2>
        <mat-form-field>
          <textarea matInput required placeholder="Vote parameters"></textarea>
        </mat-form-field>
        <div><button mat-raised-button color="primary">Launch</button></div>
      </form>
    </div>
  `
})
export class AppComponent {
}
