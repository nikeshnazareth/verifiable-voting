import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MaterialModule } from '../../../material/material.module';
import { Mock } from '../../../mock/module';
import { ICandidateTotal, ResultsComponent } from './results-component';

describe('Component: ResultsComponent', () => {
  let fixture: ComponentFixture<ResultsComponent>;
  let page: Page;

  class Page {
    public table: DebugElement;

    constructor() {
      this.table = fixture.debugElement.query(By.css('mat-table'));
      fixture.componentInstance.tally = Page.defaultTally;
    }

    static getDisplayedData(): string[][] {
      return fixture.debugElement.queryAll(By.css('mat-row'))
        .map(row =>
          row.queryAll(By.css('mat-cell'))
            .map(cell => cell.nativeElement.innerText)
        );
    }

    static get defaultTally() {
      const tally: ICandidateTotal[] = Mock.AnonymousVotingContractCollections[0]
        .parameters.candidates.map(candidate => ({candidate: candidate, count: 0}));

      // choose a non-sorted distribution
      [0, 2, 1].forEach((total, idx) => {
        tally[idx].count = total;
      });
      return tally;
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ResultsComponent
      ],
      imports: [
        MaterialModule
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ResultsComponent);
        page = new Page();
      });
  }));

  beforeEach(() => fixture.detectChanges());

  describe('Structure', () => {
    it('should have a table to house the results', () => {
      expect(page.table).toBeTruthy();
    });

    it('should have a table row for each candidate', () => {
      expect(Page.getDisplayedData().length).toEqual(Page.defaultTally.length);
    });

    it('should have two columns in the table', () => {
      Page.getDisplayedData().forEach(row => {
        expect(row.length).toEqual(2);
      });
    });
  });

  describe('Content', () => {
    const candidateIdx = 0;
    const countIdx = 1;

    it('should display all the candidates with their vote count', () => {
      Page.defaultTally.forEach(candidateTotal => {
        const matching = Page.getDisplayedData().filter(row => row[candidateIdx] === candidateTotal.candidate);
        expect(matching.length).toEqual(1);
        expect(Number(matching[0][countIdx])).toEqual(candidateTotal.count);
      });
    });

    it('should list the candidates in decreasing order of their popularity', () => {
      let min: number;
      Page.getDisplayedData().forEach((row, idx) => {
        const count: number = Number(row[countIdx]);
        if (idx > 0) {
          expect(count <= min).toEqual(true);
        }
        min = count;
      });
    });
  });
});
