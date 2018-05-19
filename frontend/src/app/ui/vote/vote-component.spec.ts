import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { VoteComponent } from './vote-component';
import { MaterialModule } from '../../material/material.module';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { Mock } from '../../mock/module';
import { IVotingContractDetails } from '../../core/vote-retrieval/vote-retreival.service.constants';

describe('Component: VoteComponent', () => {
  let fixture: ComponentFixture<VoteComponent>;
  let page: Page;

  class Page {
    public static ARBITRARY_INDICES: number[] = [1, 2, 1, 0, 3];

    public container: DebugElement;
    public title: DebugElement;
    public topic: DebugElement;
    public phase: DebugElement;
    public voteRetrievalSvc: VoteRetrievalService;

    constructor() {
      this.container = fixture.debugElement.query(By.css('.container'));
      this.title = this.container.query(By.css('h2'));
      this.topic = this.container.query(By.css('.topic'));
      this.phase = this.container.query(By.css('.phase'));
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        VoteComponent
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

    it('should have a topic element', () => {
      expect(page.topic).toBeTruthy();
    });

    it('should have a phase element', () => {
      expect(page.phase).toBeTruthy();
    });
  });

  describe('Title', () => {
    it('should state "Vote #[index]"', () => {
      fixture.componentInstance.index = Page.ARBITRARY_INDICES[0];
      fixture.detectChanges();
      expect(page.title.nativeElement.innerText).toEqual('Vote #' + Page.ARBITRARY_INDICES[0]);
    });

    it('should update whenever index is changed', () => {
      Page.ARBITRARY_INDICES.map(idx => {
        fixture.componentInstance.index = Page.ARBITRARY_INDICES[idx];
        fixture.detectChanges();
        expect(page.title.nativeElement.innerText).toEqual('Vote #' + Page.ARBITRARY_INDICES[idx]);
      });
    });
  });

  describe('Topic', () => {
    it('should state the specified vote topic', () => {
      fixture.componentInstance.index = Page.ARBITRARY_INDICES[0];
      fixture.detectChanges();
      const topic: string = Mock.AnonymousVotingContractCollections[Page.ARBITRARY_INDICES[0]].parameters.topic;
      expect(page.topic.nativeElement.innerText).toEqual(topic);
    });

    it('should update whenever index is changed', () => {
      Page.ARBITRARY_INDICES.map(idx => {
        fixture.componentInstance.index = Page.ARBITRARY_INDICES[idx];
        fixture.detectChanges();
        const topic: string = Mock.AnonymousVotingContractCollections[Page.ARBITRARY_INDICES[idx]].parameters.topic;
        expect(page.topic.nativeElement.innerText).toEqual(topic);
      });
    });
  });

  fdescribe('Phase', () => {

    it('should state the specified phase', () => {
      fixture.componentInstance.index = Page.ARBITRARY_INDICES[0];
      fixture.detectChanges();
      const phase: number = Mock.AnonymousVotingContractCollections[Page.ARBITRARY_INDICES[0]].currentPhase;
      expect(page.phase.nativeElement.innerText).toEqual(VotePhases[phase]);
    });

    it('should update whenever index is changed', () => {
      Page.ARBITRARY_INDICES.map(idx => {
        fixture.componentInstance.index = Page.ARBITRARY_INDICES[idx];
        fixture.detectChanges();
        const phase: number = Mock.AnonymousVotingContractCollections[Page.ARBITRARY_INDICES[idx]].currentPhase;
        expect(page.phase.nativeElement.innerText).toEqual(VotePhases[phase]);
      });
    });

    it('should update whenever the phase changes', () => {
      // replace the phase parameter with a subject we control
      const phase$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
      const details$: Observable<IVotingContractDetails> =
        page.voteRetrievalSvc.detailsAtIndex$(Page.ARBITRARY_INDICES[0])
          .combineLatest(phase$, (details, phase) => {
            details.phase = VotePhases[phase];
            return details;
          });
      spyOn(page.voteRetrievalSvc, 'detailsAtIndex$').and.returnValue(details$);

      fixture.detectChanges();
      let phaseIdx: number = Mock.AnonymousVotingContractCollections[Page.ARBITRARY_INDICES[0]].currentPhase;
      expect(page.phase.nativeElement.innerText).toEqual(VotePhases[phaseIdx]);

      phaseIdx++;
      phase$.next(phaseIdx);
      fixture.detectChanges();
      expect(page.phase.nativeElement.innerText).toEqual(VotePhases[phaseIdx]);
    });
  });

  describe('Functionality', () => {

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
  });
});
