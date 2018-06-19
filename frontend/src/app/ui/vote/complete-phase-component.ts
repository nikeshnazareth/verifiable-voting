import { Component, Input } from '@angular/core';


export interface ICandidateTotal {
  candidate: string;
  count: number;
}

@Component({
  selector: 'vv-complete-phase',
  template: `
    <div *ngFor="let candidateTotal of tally$ | async">
      {{candidateTotal.candidate}} : {{candidateTotal.count}}
    </div>
  `,
})
export class CompletePhaseComponent {
  @Input() tally: ICandidateTotal[];
}


