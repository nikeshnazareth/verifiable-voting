import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';

import { IIPFSService, IPFSService } from '../../core/ipfs/ipfs.service';
import { ListVotesComponent } from './list-votes.component';
import {
  IVoteListingContractService,
  VoteListingContractService
} from '../../core/ethereum/vote-listing-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';

describe('Component: ListVotesComponent', () => {
  let fixture: ComponentFixture<ListVotesComponent>;
  let page: Page;

  class Page {
    public ipfsSvc: IIPFSService;
    public voteListingSvc: IVoteListingContractService;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.ipfsSvc = compInjector.get(IPFSService);
      this.voteListingSvc = compInjector.get(VoteListingContractService);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ListVotesComponent
      ],
      imports: [],
      providers: [
        {provide: VoteListingContractService, useClass: MockVoteListingContractSvc},
        {provide: IPFSService, useClass: MockIPFSSvc}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ListVotesComponent);
        page = new Page();
        fixture.detectChanges();
      });
  }));

  describe('Structure', () => {
    xit('should have table to house the vote contract interfaces');

    xit('should have two columns in the table');

    xit('should start with a table row for each contract address');

    xit('should add a new row every time a new vote is deployed');
  });

  describe('Functionality', () => {

    describe('first table column', () => {
      xit('it should display the contract addresses');
    });

    describe('second table column', () => {
      xit('it should display the voting parameters if they can be retrieved from IPFS');

      xit('it should display the text "UNAVAILABLE" if the voting parameter cannot be retrieved');
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

class MockIPFSSvc implements IIPFSService {
  addJSON(data: object): Promise<string> {
    return Promise.resolve('');
  }

  catJSON(hash: string): Promise<object> {
    return Promise.resolve({});
  }
}

class MockVoteListingContractSvc implements IVoteListingContractService {
  voteCreated$: EventEmitter<string>;

  deployVote(paramsHash: string): Promise<void> {
    return Promise.resolve();
  }

  deployedVotes(): Promise<address[]> {
    return Promise.resolve([]);
  }
}
