import { Component } from '@angular/core';

@Component({
  selector: 'vv-disclaimer',
  template: `
    <div class="container">
      <h2>Project no longer being developed</h2>

      <h3>Current Status</h3>
      <p>As it stands, this project allows users to deploy votes and participate in them anonymously.</p>
      <p>There are many ways it could be extended to increase the functionality, security and user experience.</p>
      <p>However, for now, development has halted.</p>

      <h3>Purpose</h3>
      <p>The purpose of the project was for my own eduction:
        to design, deploy and test a complex Ethereum distributed app (Dapp) using IPFS for storage.</p>
      <p>It has achieved that purpose. I may return to extend it at a future date.</p>

      <h3>Code</h3>
      <p>The code is available under the MIT licence on <a href="https://github.com/nikeshnazareth/verifiable-voting">GitHub</a></p>
      <p>If anyone would like to use the system or build on it, I will reiterate the disclaimer from the first explanatory video:</p>

      <blockquote>
        <p>
          Hopefully obvious disclaimer: all the claims made in this video series are accurate,
          but the entire project is one guy's effort to learn and practise the skills required
          to design, build and explain a moderately complex security system.
          It does not cover many aspects (such as securing the user's personal machine,
          ensuring connectivity to the right nodes, coercion resistance, etc.)
          that would need to be considered in a critical deployment.
        </p>
        <p>
          Security is hard, especially for online voting systems, and there are rivers of
          academic ink devoted to getting it right. Don't be the person who makes important
          decisions based on a random video that says the word "blockchain"
        </p>
      </blockquote>
    </div>
  `,
  styleUrls: ['./disclaimer.component.scss']
})
export class DisclaimerComponent {
}
