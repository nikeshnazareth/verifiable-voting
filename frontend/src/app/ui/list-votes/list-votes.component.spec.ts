import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, EventEmitter } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ListVotesComponent } from './list-votes.component';
import {
  IVoteListingContractService,
  VoteListingContractService
} from '../../core/ethereum/vote-listing-contract/contract.service';
import { Mock } from './list-votes.component.spec.mock';
import { IVoteManagerService, VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { MaterialModule } from '../../material/material.module';
import { address } from '../../core/ethereum/type.mappings';
import DUMMY_ADDRESSES = Mock.DUMMY_ADDRESSES;

describe('Component: ListVotesComponent', () => {
  let fixture: ComponentFixture<ListVotesComponent>;
  let page: Page;

  class Page {
    public voteListingSvc: IVoteListingContractService;
    public voteManagerSvc: IVoteManagerService;
    public table: DebugElement;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.voteListingSvc = compInjector.get(VoteListingContractService);
      this.voteManagerSvc = compInjector.get(VoteManagerService);
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
        {provide: VoteListingContractService, useClass: Mock.VoteListingContractService},
        {provide: VoteManagerService, useClass: Mock.VoteManagerService}
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
      expect(page.table).toBeTruthy();
    });

    it('should have two columns in the table', () => {
      Page.getRows().forEach(row => {
        expect(row.queryAll(By.css('mat-cell')).length).toEqual(2);
      });
    });

    it('should have a heading row with the values [#, Parameters]', () => {
      fixture.detectChanges();
      const EXPECTED_HEADERS: string[] = ['#', 'Parameters'];
      const headerRows: DebugElement[] = page.table.queryAll(By.css('mat-header-row'));
      expect(headerRows.length).toEqual(1);
      const headerRow: DebugElement = headerRows[0];
      const headerElements: DebugElement[] = headerRow.queryAll(By.css('mat-header-cell'));
      const headers = headerElements.map(el => el.nativeElement.innerText);
      expect(headers).toEqual(EXPECTED_HEADERS);
    });

    it('should start with a table row for each contract address', () => {
      fixture.detectChanges(); // onInit
      expect(Page.getRows().length).toEqual(Mock.DUMMY_ADDRESSES.length);
    });

    it('should add a new row every time a new vote is deployed', () => {
      const newVote$: EventEmitter<address> = new EventEmitter<address>();
      spyOnProperty(page.voteListingSvc, 'deployedVotes$').and.returnValue(newVote$);

      fixture.detectChanges(); // onInit
      expect(Page.getRows().length).toEqual(0);

      newVote$.emit('_New Address 1_');
      fixture.detectChanges();
      expect(Page.getRows().length).toEqual(1);

      newVote$.emit('_New Address 1_');
      fixture.detectChanges();
      expect(Page.getRows().length).toEqual(2);
    });
  });

  describe('Functionality', () => {

    describe('Index column', () => {
      it('it should display the contract index (0-up indexing)', () => {
        fixture.detectChanges();
        const displayedIndices: Number[] = Page.getColumn(0).map(str => Number(str));
        expect(displayedIndices).toEqual(Page.range(DUMMY_ADDRESSES.length));
      });
    });

    describe('Parameters column', () => {
      it('should display the parameters once they are retrieved', () => {
        fixture.detectChanges();
        const displayedParameters: string[] = Page.getColumn(1);
        const mockedParams: string[] = Mock.DUMMY_ADDRESSES.map(addr => addr + '_params');
        expect(displayedParameters).toEqual(mockedParams);
      });

      xit('should display "UNKNOWN CONTRACT ADDRESS" for each unknown address');

      xit('should initially display "RETRIEVING..." for each known address');

      xit('should display "HASH UNAVAILABLE" if the parameters cannot be retrieved');

      xit('should allow different contracts to occupy the different states independently');
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


