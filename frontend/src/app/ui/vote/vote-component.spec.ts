import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs/Observable';

import { VoteComponent } from './vote-component';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import {
  IReplacementVotingContractDetails,
  RETRIEVAL_STATUS
} from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { MaterialModule } from '../../material/material.module';
import { Mock } from '../../mock/module';

describe('Component: VoteComponent', () => {
  let fixture: ComponentFixture<VoteComponent>;
  let page: Page;

  class Page {
    public static ARBITRARY_CONTRACT_INDICES: number[] = [1, 2, 1, 0, 3];
    public voteRetrievalSvc: VoteRetrievalService;

    constructor() {
      this.voteRetrievalSvc = fixture.debugElement.injector.get(VoteRetrievalService);
    }

    get container(): DebugElement {
      return fixture.debugElement.query(By.css('.container'));
    }

    get title(): DebugElement {
      return this.container.query(By.css('h2'));
    }

    get expansionPanels(): DebugElement[] {
      return this.container.queryAll(By.css('mat-expansion-panel'));
    }

    get panelDescriptions(): string[] {
      return this.expansionPanels
        .map(panel => panel.query(By.css('mat-panel-description')).nativeElement.innerHTML);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        VoteComponent,
        StubRegistrationPhaseComponent,
        StubVotingPhaseComponent,
        StubCompletePhaseComponent
      ],
      imports: [
        MaterialModule,
        BrowserAnimationsModule
      ],
      providers: [
        {provide: VoteRetrievalService, useClass: Mock.VoteRetrievalService},
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(VoteComponent);
        page = new Page();
      });
  }));

  describe('Structure', () => {
    describe('case: after vote is selected', () => {
      beforeEach(() => {
        fixture.componentInstance.index = 0;
        fixture.detectChanges();
      });

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
            expect(panel.query(By.css('mat-expansion-panel-header')).nativeElement.innerText.trim()).toEqual('REGISTER');
          });

          it('should have a description', () => {
            expect(panel.query(By.css('mat-panel-description'))).toBeTruthy();
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
            expect(panel.query(By.css('mat-expansion-panel-header')).nativeElement.innerText.trim()).toEqual('VOTE');
          });

          it('should have a description', () => {
            expect(panel.query(By.css('mat-panel-description'))).toBeTruthy();
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
            expect(panel.query(By.css('mat-expansion-panel-header')).nativeElement.innerText.trim()).toEqual('RESULTS');
          });

          it('should have a description', () => {
            expect(panel.query(By.css('mat-panel-description'))).toBeTruthy();
          });

          it('should have a vv-complete-phase element', () => {
            expect(panel.query(By.css('vv-complete-phase'))).toBeTruthy();
          });
        });

      });
    });
  });

  describe('User Interface', () => {
    describe('container', () => {
      it('should not exist initially', () => {
        fixture.detectChanges();
        expect(page.container).toBeFalsy();
      });

      it('should be created when the index is set', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        expect(page.container).toBeTruthy();
      });

      it('should stay visible with subsequent changes to the index', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        fixture.componentInstance.index = 3;
        fixture.detectChanges();
        expect(page.container).toBeTruthy();
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

    describe('Expansion Panels', () => {
      const idx: number = 0;
      let details: IReplacementVotingContractDetails;

      beforeEach(() => {
        const collection = Mock.AnonymousVotingContractCollections[idx];
        details = {
          index: idx,
          topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic},
          phase: {status: RETRIEVAL_STATUS.AVAILABLE, value: VotePhases[collection.currentPhase]}
        };
        fixture.componentInstance.index = idx;
      });

      describe('parameter: phase', () => {
        describe('case: it is being retrieved', () => {
          beforeEach(() => {
            details.phase = { status: RETRIEVAL_STATUS.RETRIEVING, value: null};
            spyOn(page.voteRetrievalSvc, 'replacementDetailsAtIndex$').and.returnValue(Observable.of(details));
            fixture.detectChanges();
          });

          it(`should state [${RETRIEVAL_STATUS.RETRIEVING}] on all expansion panel descriptions`, () => {
            page.panelDescriptions.map(description => {
              expect(description).toEqual(`[${RETRIEVAL_STATUS.RETRIEVING}]`);
            });
          });

          it('should disable all expansion panels', () => {
            page.expansionPanels.map(panel => expect(panel.componentInstance.disabled).toEqual(true));
          });
        });
      });
    });

    describe('Registration Phase Component', () => {
      const regPhaseComponent = () => fixture.debugElement.query(By.css('vv-registration-phase'));

      it('should track the index of the Vote Component', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(regPhaseComponent().componentInstance.index).toEqual(idx);
        });
      });
    });

    describe('Voting Phase Component', () => {
      const votingPhaseComp = () => fixture.debugElement.query(By.css('vv-voting-phase'));

      it('should track the index of the Vote Component', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(votingPhaseComp().componentInstance.index).toEqual(idx);
        });
      });
    });

    describe('Complete Phase Component', () => {
      const completePhaseComp = () => fixture.debugElement.query(By.css('vv-complete-phase'));

      it('should track the index of the Vote Component', () => {
        Page.ARBITRARY_CONTRACT_INDICES.map(idx => {
          fixture.componentInstance.index = idx;
          fixture.detectChanges();
          expect(completePhaseComp().componentInstance.index).toEqual(idx);
        });
      });
    });

  });
});

@Component({
  selector: 'vv-registration-phase',
  template: ''
})
class StubRegistrationPhaseComponent {
  @Input() index;
}

@Component({
  selector: 'vv-voting-phase',
  template: ''
})
class StubVotingPhaseComponent {
  @Input() index;
}


@Component({
  selector: 'vv-complete-phase',
  template: ''
})
class StubCompletePhaseComponent {
  @Input() index;
}


