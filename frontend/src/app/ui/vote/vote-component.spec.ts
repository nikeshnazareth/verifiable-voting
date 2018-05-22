import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { VoteComponent } from './vote-component';
import { MaterialModule } from '../../material/material.module';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { RegistrationPhaseComponent } from './registration-phase.component';
import { VotingPhaseComponent } from './voting-phase.component';
import { CompletePhaseComponent } from './complete-phase-component';
import { Mock } from '../../mock/module';

describe('Component: VoteComponent', () => {
  let fixture: ComponentFixture<VoteComponent>;
  let page: Page;

  class Page {
    public static ARBITRARY_CONTRACT_INDICES: number[] = [1, 2, 1, 0, 3];

    public container: DebugElement;
    public title: DebugElement;
    public expansionPanels: DebugElement[];
    public voteRetrievalSvc: VoteRetrievalService;

    constructor() {
      this.container = fixture.debugElement.query(By.css('.container'));
      this.title = this.container.query(By.css('h2'));
      this.expansionPanels = this.container.queryAll(By.css('mat-expansion-panel'));
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        VoteComponent,
        RegistrationPhaseComponent,
        VotingPhaseComponent,
        CompletePhaseComponent
      ],
      imports: [
        MaterialModule,
        BrowserAnimationsModule
      ],
      providers: [
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(VoteComponent);
        page = new Page();
      });
  }));

  describe('Structure', () => {


    beforeEach(() => fixture.detectChanges());

    it('should have a container element', () => {
      expect(page.container).toBeTruthy();
    });

    it('should have a title element', () => {
      expect(page.title).toBeTruthy();
    });

    describe('expansion panels', () => {
      let panel: DebugElement;

      it('should have three of them', () => {
        expect(page.expansionPanels.length).toEqual(3);
      });

      describe('first expansion panel', () => {
        beforeEach(() => {
          panel = page.expansionPanels[0];
        });

        it('should have a header', () => {
          expect(panel.query(By.css('mat-expansion-panel-header'))).toBeTruthy();
        });

        it('should set the header contents to "REGISTER"', () => {
          expect(panel.query(By.css('mat-expansion-panel-header')).nativeElement.innerText).toEqual('REGISTER');
        });

        it('should have a vv-registration-phase element', () => {
          expect(panel.query(By.css('vv-registration-phase'))).toBeTruthy();
        });
      });

      describe('second expansion panel', () => {
        beforeEach(() => {
          panel = page.expansionPanels[1];
        });

        it('should have a header', () => {
          expect(panel.query(By.css('mat-expansion-panel-header'))).toBeTruthy();
        });

        it('should set the header contents to "VOTE"', () => {
          expect(panel.query(By.css('mat-expansion-panel-header')).nativeElement.innerText).toEqual('VOTE');
        });

        it('should have a vv-voting-phase element', () => {
          expect(panel.query(By.css('vv-voting-phase'))).toBeTruthy();
        });
      });

      describe('third expansion panel', () => {
        beforeEach(() => {
          panel = page.expansionPanels[2];
        });

        it('should have a header', () => {
          expect(panel.query(By.css('mat-expansion-panel-header'))).toBeTruthy();
        });

        it('should set the header contents to "RESULTS"', () => {
          expect(panel.query(By.css('mat-expansion-panel-header')).nativeElement.innerText).toEqual('RESULTS');
        });

        it('should have a vv-complete-phase element', () => {
          expect(panel.query(By.css('vv-complete-phase'))).toBeTruthy();
        });
      });

    });
  });



  describe('User Interface', () => {
    describe('container', () => {
      it('should be hidden initially', () => {
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(true);
      });

      it('should become visible when input is set', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(false);
      });

      it('should become visible when input is set to zero', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 0;
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(false);
      });

      it('should stay visible with subsequent changes to input', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        fixture.componentInstance.index = 3;
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(false);
      });
    });

    describe('Title', () => {
      it('should have the format "[index]. [topic]"', () => {
        const idx: number = Page.ARBITRARY_CONTRACT_INDICES[0];
        const topic: string = Mock.AnonymousVotingContractCollections[idx].parameters.topic;
        fixture.componentInstance.index = idx;
        fixture.detectChanges();
        expect(page.title.nativeElement.innerText).toEqual(`${idx}. ${topic}`);
      });

      it('should update whenever index is changed', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          const topic: string = Mock.AnonymousVotingContractCollections[idx].parameters.topic;
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(page.title.nativeElement.innerText).toEqual(`${idx}. ${topic}`);
        });
      });
    });

    describe('Registration Phase Component', () => {
      let regPhaseComp: DebugElement;

      beforeEach(() => {
        regPhaseComp = fixture.debugElement.query(By.css('vv-registration-phase'));
      });

      it('should track the index of the Vote Component', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(regPhaseComp.componentInstance.index).toEqual(String(idx));
        });
      });
    });

    describe('Voting Phase Component', () => {
      let votingPhaseComp: DebugElement;

      beforeEach(() => {
        votingPhaseComp = fixture.debugElement.query(By.css('vv-voting-phase'));
      });

      it('should track the index of the Vote Component', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(votingPhaseComp.componentInstance.index).toEqual(String(idx));
        });
      });
    });

    describe('Complete Phase Component', () => {

      let completePhaseComp: DebugElement;

      beforeEach(() => {
        completePhaseComp = fixture.debugElement.query(By.css('vv-complete-phase'));
      });

      it('should track the index of the Vote Component', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(completePhaseComp.componentInstance.index).toEqual(String(idx));
        });
      });
    });

  });
});
