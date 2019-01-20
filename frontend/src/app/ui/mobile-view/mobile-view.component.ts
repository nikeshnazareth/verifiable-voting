import { Component } from '@angular/core';

@Component({
  selector: 'vv-mobile-view',
  template: `
    <div class="apology">
      <h2>Apology</h2>
      <p>Unfortunately, the developer of this site is living in the past
        and has not created a site that is usable with small screens.</p>
      <p>Please use a device with a larger screen to participate in the voting process.</p>
      <p>In the meantime, here are some videos explaining the system.</p>
    </div>
    <mat-divider></mat-divider>
    <vv-explanation></vv-explanation>
  `,
  styleUrls: ['./mobile-view.component.scss']
})
export class MobileViewComponent {
}
