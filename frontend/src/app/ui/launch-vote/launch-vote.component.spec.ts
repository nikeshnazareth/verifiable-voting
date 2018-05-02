import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { LaunchVoteComponent } from './launch-vote.component';
import { IIPFSService, IPFSService } from '../../core/ipfs/ipfs.service';
import { MaterialModule } from '../../material/material.module';
import {
  IVoteListingContractService,
  VoteListingContractService
} from '../../core/ethereum/vote-listing-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';

describe('Component: LaunchVoteComponent', () => {
  let fixture: ComponentFixture<LaunchVoteComponent>;
  let page: Page;

  class Page {
    public ipfsSvc: IIPFSService;
    public voteListingSvc: IVoteListingContractService;
    public textArea: HTMLTextAreaElement;
    public submitButton: HTMLButtonElement;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.ipfsSvc = compInjector.get(IPFSService);
      this.voteListingSvc = compInjector.get(VoteListingContractService);
      this.textArea = fixture.debugElement.query(By.css('textarea')).nativeElement;
      this.submitButton = fixture.debugElement.query(By.css('button')).nativeElement;
    }

    setTextValue(value: string) {
      this.textArea.value = value;
      // trigger an event so Angular knows about the update
      this.textArea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        LaunchVoteComponent
      ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
      ],
      providers: [
        {provide: VoteListingContractService, useClass: MockVoteListingContractSvc},
        {provide: IPFSService, useClass: MockIPFSSvc}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(LaunchVoteComponent);
        page = new Page();
        fixture.detectChanges();
      });
  }));

  describe('Structure', () => {
    it('should have an empty text area to enter the vote parameters', () => {
      expect(page.textArea).toBeDefined();
      expect(page.textArea.value).toBe('');
    });

    it('should have a button to submit the form', () => {
      expect(page.submitButton).toBeDefined();
    });
  });

  describe('User Interface', () => {
    it('should start with the submit button disabled', () => {
      fixture.detectChanges();
      expect(page.submitButton.disabled).toBe(true);
    });


    it('should enable the submit button when the text area has content', () => {
      fixture.detectChanges();
      expect(page.submitButton.disabled).toBe(true);
      page.setTextValue('Some value');
      expect(page.submitButton.disabled).toBe(false);
    });

    it('should disable the submit button if the text area is cleared', () => {
      fixture.detectChanges();
      fixture.detectChanges();
      expect(page.submitButton.disabled).toBe(true);
      page.setTextValue('Some value');
      expect(page.submitButton.disabled).toBe(false);
      page.setTextValue('');
      expect(page.submitButton.disabled).toBe(true);
    });
  });

  describe('Functionality', () => {
    const vote_params: string = 'Some arbitrary text';
    const json_obj = {parameters: vote_params};

    beforeEach(() => {
      page.setTextValue(vote_params);
    });

    it('should wrap the content of the text area in an object and publish it to IPFS', () => {
      spyOn(page.ipfsSvc, 'addJSON').and.callThrough();
      page.submitButton.click();
      expect(page.ipfsSvc.addJSON).toHaveBeenCalledWith(json_obj);
    });

    xit('should handle errors when adding the vote parameters to IPFS', () => {
    }); // TODO

    it('should get the IPFS hash and publish it to Ethereum', fakeAsync(() => {
      spyOn(page.voteListingSvc, 'deployVote').and.callThrough();
      page.submitButton.click();
      tick(); // we need to wait for the promise to return before inspecting deployVote
      expect(page.voteListingSvc.deployVote).toHaveBeenCalledWith(DUMMY_HASH);
    }));
  });
});

const DUMMY_HASH = 'DUMMY_HASH';

class MockIPFSSvc implements IIPFSService {
  addJSON(data: object): Promise<string> {
    return Promise.resolve(DUMMY_HASH);
  }

  catJSON(hash: string): Promise<object> {
    return Promise.resolve({});
  }
}

class MockVoteListingContractSvc implements IVoteListingContractService {
  deployedVotes$: Observable<address> = Observable.of(null);

  deployVote(paramsHash: string): Observable<ITransactionReceipt> {
    return Observable.of({});
  }
}
