import { Component, Input } from '@angular/core';


export interface ICandidateTotal {
  candidate: string;
  count: number;
}

@Component({
  selector: 'vv-results',
  templateUrl: './results-component.html',
})
export class ResultsComponent {
  public sortedTally: ICandidateTotal[];
  public displayedColumns: string[] = ['candidate', 'count'];

  constructor() {
    this.sortedTally = [];
  }

  @Input()
  set tally(val: ICandidateTotal[]) {
    if (val) {
      this.sortedTally = val.map(v => v); // make a shallow copy
      this.sortedTally.sort((a, b) => b.count - a.count);
    }
  }
}


