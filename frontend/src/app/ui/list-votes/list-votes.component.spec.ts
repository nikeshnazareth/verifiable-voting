import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ListVotesComponent } from './list-votes.component';
import { IVoteRetrievalService, VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { Mock } from '../../mock/module';

describe('Component: ListVotesComponent', () => {
  let fixture: ComponentFixture<ListVotesComponent>;
  let page: Page;

  class Page {
    public voteRetrievalSvc: IVoteRetrievalService;
    public table: DebugElement;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.voteRetrievalSvc = compInjector.get(VoteRetrievalService);
      this.table = fixture.debugElement.query(By.css('mat-table'));
    }

    static getRows(): DebugElement[] {
      return fixture.debugElement.queryAll(By.css('mat-row'));
    }

    static getColumn(idx): string[] {
      return Page.getRows()
        .map(row => row.queryAll(By.css('mat-cell')))
        .map(cells => cells[idx])
        .map(indexCell => indexCell.nativeElement.innerText);
    }

    static range(count): Number[] {
      return Array(count).fill(0).map((_, idx) => idx);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ListVotesComponent
      ],
      imports: [
        MaterialModule
      ],
      providers: [
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ListVotesComponent);
        page = new Page();
      });
  }));

  describe('Structure', () => {
    it('should have a table to house the vote contract interfaces', () => {
      fixture.detectChanges();
      expect(page.table).toBeTruthy();
    });

    it('should have three columns in the table', () => {
      fixture.detectChanges();
      Page.getRows().forEach(row => {
        expect(row.queryAll(By.css('mat-cell')).length).toEqual(3);
      });
    });

    it('should have a heading row with the values [#, Phase, Topic]', () => {
      fixture.detectChanges();
      const EXPECTED_HEADERS: string[] = ['#', 'Phase', 'Topic'];
      const headerRows: DebugElement[] = page.table.queryAll(By.css('mat-header-row'));
      expect(headerRows.length).toEqual(1);
      const headerRow: DebugElement = headerRows[0];
      const headerElements: DebugElement[] = headerRow.queryAll(By.css('mat-header-cell'));
      const headers = headerElements.map(el => el.nativeElement.innerText);
      expect(headers).toEqual(EXPECTED_HEADERS);
    });

    it('should have a table row for each contract', () => {
      fixture.detectChanges(); // onInit
      expect(Page.getRows().length).toEqual(Mock.AnonymousVotingContractCollections.length);
    });
  });

  describe('Content', () => {

    describe('Index column', () => {
      it('it should display the "index" value in the vote summaries', fakeAsync(() => {
        fixture.detectChanges();
        let expectedIndices: number[];
        page.voteRetrievalSvc.summaries$.subscribe(summaries => {
          expectedIndices = summaries.map(summary => summary.index);
        });
        tick();
        const displayedIndices: Number[] = Page.getColumn(0).map(str => Number(str));
        expect(displayedIndices).toEqual(expectedIndices);
      }));
    });

    describe('Phase column', () => {
      it('it should display the "phase" value in the vote summaries', fakeAsync(() => {
        fixture.detectChanges();
        let expectedStatuses: string[];
        page.voteRetrievalSvc.summaries$.subscribe(summaries => {
          expectedStatuses = summaries.map(summary => summary.phase);
        });
        tick();
        const displayedStatuses: string[] = Page.getColumn(1);
        expect(displayedStatuses).toEqual(expectedStatuses);
      }));
    });

    describe('Topic column', () => {
      it('it should display the "topic" value in the vote summaries', fakeAsync(() => {
        fixture.detectChanges();
        let expectedTopics: string[];
        page.voteRetrievalSvc.summaries$.subscribe(summaries => {
          expectedTopics = summaries.map(summary => summary.topic);
        });
        tick();
        const displayedTopics: string[] = Page.getColumn(2);
        expect(displayedTopics).toEqual(expectedTopics);
      }));
    });
  });

  describe('User Interface', () => {
    describe('selected contract', () => {
      xit('it should start empty');

      xit('it should emit the contract address when a table row is selected');

      xit('it should continue to emit addresses for every selection');
    });
  });
});


