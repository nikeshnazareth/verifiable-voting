import { Component } from '@angular/core';

@Component({
  selector: 'vv-explanation',
  template: `
    <div class="container">
      <h2>Overview</h2>
      <p>The fundamental design principle that motivates the system</p>
      <iframe width="560" height="315"
              src="https://www.youtube.com/embed/WLcVkGiveuM?rel=0"
              frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
      </iframe>
      <mat-divider></mat-divider>

      <h2>Technology</h2>
      <p>The basics of Ethereum and RSA blinding</p>
      <iframe width="560" height="315"
              src="https://www.youtube.com/embed/Vrf1OX_5SaU?rel=0"
              frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
      </iframe>
      <mat-divider></mat-divider>

      <h2>Design</h2>
      <p>How the voting system works under the hood</p>
      <iframe width="560" height="315"
              src="https://www.youtube.com/embed/BlHHTXridOE?rel=0"
              frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
      </iframe>
      <mat-divider></mat-divider>

      <h2>Technicalities</h2>
      <p>There's always a catch</p>
      <iframe width="560" height="315"
              src="https://www.youtube.com/embed/Rc3zEhXB_QE?rel=0"
              frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
      </iframe>
    </div>
  `,
  styleUrls: ['./explanation.component.scss']
})
export class ExplanationComponent {
}
