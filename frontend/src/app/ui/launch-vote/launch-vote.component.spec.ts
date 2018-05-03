import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';

import { LaunchVoteComponent } from './launch-vote.component';
import { MaterialModule } from '../../material/material.module';
import { IVoteManagerService, IVoteParameters, VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { address } from '../../core/ethereum/type.mappings';


describe('Component: LaunchVoteComponent', () => {
  let fixture: ComponentFixture<LaunchVoteComponent>;
  let page: Page;

  class Page {
    public voteManagerSvc: VoteManagerService;
    public textArea: HTMLTextAreaElement;
    public submitButton: HTMLButtonElement;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.voteManagerSvc = compInjector.get(VoteManagerService);
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
        {provide: VoteManagerService, useClass: MockVoteManagerService}
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

    beforeEach(() => {
      page.setTextValue(DUMMY_VOTE_PARAMETERS.parameters);
    });

    describe('submit button', () => {
      it('should wrap the parameters in an IVoteParameters object and pass it to VoteManager.deployVote$', () => {
        spyOn(page.voteManagerSvc, 'deployVote$').and.callThrough();
        page.submitButton.click();
        expect(page.voteManagerSvc.deployVote$).toHaveBeenCalledWith(DUMMY_VOTE_PARAMETERS);
      });
    });
  });

  const DUMMY_VOTE_PARAMETERS: IVoteParameters = {
    parameters: 'dummy parameters text'
  };

  const DUMMY_TX_RECEIPT: ITransactionReceipt = {
    tx: 'A dummy tranasction'
  };

  class MockVoteManagerService implements IVoteManagerService {
    deployVote$(params: IVoteParameters): Observable<ITransactionReceipt> {
      return Observable.of(DUMMY_TX_RECEIPT);
    };

    getParameters$(addr: address): Observable<IVoteParameters> {
      return null;
    };
  }
});


