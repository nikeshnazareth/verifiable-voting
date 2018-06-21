import { Component, Input } from '@angular/core';


export interface ICandidateTotal {
  candidate: string;
  count: number;
}

@Component({
  selector: 'vv-results',
  template: `
    <div *ngFor="let candidateTotal of tally">
      {{candidateTotal.candidate}} : {{candidateTotal.count}}
    </div>
  `,
})
export class ResultsComponent {
  @Input() tally: ICandidateTotal[];
}


