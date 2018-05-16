import { Component, Input } from '@angular/core';

@Component({
  selector: 'vv-vote',
  template: `
    <div class="container" [hidden]="!_voteSelected()">
      <h2>Vote #{{index}}</h2>
    </div>
  `,
})
export class VoteComponent {
  @Input() index: number;

  private _voteSelected(): boolean {
    return typeof(this.index) !== 'undefined';
  }
}
