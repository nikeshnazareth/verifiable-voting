import { DebugElement } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Observable } from 'rxjs/Observable';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.constants';
import { IVotingContractSummary, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { IVoteRetrievalService, VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { MaterialModule } from '../../material/material.module';
import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Mock } from '../../mock/module';
import { ListVotesComponent } from './list-votes.component';
import Spy = jasmine.Spy;

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
      let expectedIndices: number[];
      let displayedIndices: number[];

      const init_indices = fakeAsync(() => {
        fixture.detectChanges();
        page.voteRetrievalSvc.summaries$.subscribe(summaries => {
          expectedIndices = summaries.map(summary => summary.index);
        });
        tick();
        displayedIndices = Page.getColumn(0).map(str => Number(str));
      });

      it('it should display the "index" value in the vote summaries', () => {
        init_indices();
        expect(displayedIndices).toEqual(expectedIndices);
      });
    });

    describe('Phase column', () => {
      let phaseValues: string[];
      let displayedPhases: string[];

      const init_phases = fakeAsync(() => {
        fixture.detectChanges();
        page.voteRetrievalSvc.summaries$.subscribe(summaries => {
          phaseValues = summaries.map(summary => summary.phase.value);
        });
        tick();
        displayedPhases = Page.getColumn(1);
      });

      it('it should display the "phase" value', () => {
        init_phases();
        expect(displayedPhases).toEqual(phaseValues);
      });

      describe('case: one of the "phase" values is still being retrieved', () => {
        const waitingIndex = 2;

        beforeEach(() => spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.callFake(() => {
          const summaries = Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
            index: idx,
            address: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.address},
            phase: {
              status: RETRIEVAL_STATUS.AVAILABLE,
              value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
            },
            topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic}
          }));
          summaries[waitingIndex].phase = {status: RETRIEVAL_STATUS.RETRIEVING, value: null};
          return Observable.of(summaries);
        }));

        it(`should display ${RETRIEVAL_STATUS.RETRIEVING}`, () => {
          init_phases();
          expect(displayedPhases[waitingIndex]).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('should not affect the other phases', () => {
          init_phases();
          displayedPhases.map((phase, idx) => {
            if (idx !== waitingIndex) {
              expect(phase).toEqual(phaseValues[idx]);
            }
          });
        });
      });

      describe('case: one of the "phase" values is unavailable', () => {
        const unavailableIndex = 2;

        beforeEach(() => spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.callFake(() => {
          const summaries = Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
            index: idx,
            address: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.address},
            phase: {
              status: RETRIEVAL_STATUS.AVAILABLE,
              value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
            },
            topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic}
          }));
          summaries[unavailableIndex].phase = {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null};
          return Observable.of(summaries);
        }));

        it(`should display ${RETRIEVAL_STATUS.RETRIEVING}`, () => {
          init_phases();
          expect(displayedPhases[unavailableIndex]).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('should not affect the other phases', () => {
          init_phases();
          displayedPhases.map((phase, idx) => {
            if (idx !== unavailableIndex) {
              expect(phase).toEqual(phaseValues[idx]);
            }
          });
        });
      });
    });

    describe('Topic column', () => {
      let topicValues: string[];
      let displayedTopics: string[];

      const init_topics = fakeAsync(() => {
        fixture.detectChanges();
        page.voteRetrievalSvc.summaries$.subscribe(summaries => {
          topicValues = summaries.map(summary => summary.topic.value);
        });
        tick();
        displayedTopics = Page.getColumn(2);
      });

      it('it should display the "topic" value', () => {
        init_topics();
        expect(displayedTopics).toEqual(topicValues);
      });

      describe('case: one of the "topic" values is still being retrieved', () => {
        const waitingIndex = 2;

        beforeEach(() => spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.callFake(() => {
          const summaries = Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
            index: idx,
            address: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.address},
            phase: {
              status: RETRIEVAL_STATUS.AVAILABLE,
              value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
            },
            topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic}
          }));
          summaries[waitingIndex].topic = {status: RETRIEVAL_STATUS.RETRIEVING, value: null};
          return Observable.of(summaries);
        }));

        it(`should display ${RETRIEVAL_STATUS.RETRIEVING}`, () => {
          init_topics();
          expect(displayedTopics[waitingIndex]).toEqual(RETRIEVAL_STATUS.RETRIEVING);
        });

        it('should not affect the other topic', () => {
          init_topics();
          displayedTopics.map((phase, idx) => {
            if (idx !== waitingIndex) {
              expect(phase).toEqual(topicValues[idx]);
            }
          });
        });
      });

      describe('case: one of the "topic" values is unavailable', () => {
        const unavailableIndex = 2;

        beforeEach(() => spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.callFake(() => {
          const summaries = Mock.AnonymousVotingContractCollections.map((collection, idx) => ({
            index: idx,
            address: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.address},
            phase: {
              status: RETRIEVAL_STATUS.AVAILABLE,
              value: VotePhases[Mock.AnonymousVotingContractCollections[idx].currentPhase]
            },
            topic: {status: RETRIEVAL_STATUS.AVAILABLE, value: collection.parameters.topic}
          }));
          summaries[unavailableIndex].topic = {status: RETRIEVAL_STATUS.UNAVAILABLE, value: null};
          return Observable.of(summaries);
        }));

        it(`should display ${RETRIEVAL_STATUS.RETRIEVING}`, () => {
          init_topics();
          expect(displayedTopics[unavailableIndex]).toEqual(RETRIEVAL_STATUS.UNAVAILABLE);
        });

        it('should not affect the other topics', () => {
          init_topics();
          displayedTopics.map((phase, idx) => {
            if (idx !== unavailableIndex) {
              expect(phase).toEqual(topicValues[idx]);
            }
          });
        });
      });
    });
  });

  describe('User Interface', () => {
    describe('selected contract', () => {
      let onNext: Spy;
      const onError = err => fail(err);
      let onCompleted: Spy;

      beforeEach(() => {
        onNext = jasmine.createSpy('onNext');
        onCompleted = jasmine.createSpy('onCompleted');
      });

      it('it should start empty', () => {
        fixture.detectChanges();
        fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);

        expect(onNext).not.toHaveBeenCalled();
        expect(onCompleted).not.toHaveBeenCalled();
      });

      it('it should emit the contract index when a table row is selected', () => {
        fixture.detectChanges();
        fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);
        DOMInteractionUtility.clickOn(Page.getRows()[2]);

        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(2);
      });

      it('it should continue to emit indices when table rows are selected', () => {
        fixture.detectChanges();
        fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);

        DOMInteractionUtility.clickOn(Page.getRows()[2]);
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(2);

        DOMInteractionUtility.clickOn(Page.getRows()[0]);
        expect(onNext).toHaveBeenCalledTimes(2);
        expect(onNext.calls.mostRecent().args[0]).toEqual(0);

        DOMInteractionUtility.clickOn(Page.getRows()[3]);
        expect(onNext).toHaveBeenCalledTimes(3);
        expect(onNext.calls.mostRecent().args[0]).toEqual(3);

        DOMInteractionUtility.clickOn(Page.getRows()[2]);
        expect(onNext).toHaveBeenCalledTimes(4);
        expect(onNext.calls.mostRecent().args[0]).toEqual(2);
      });

      describe('case: one of the rows is missing information', () => {
        const incompleteIndex: number = 2;

        const completeSummary = (idx) => ({
          index: idx,
          address: {status: RETRIEVAL_STATUS.AVAILABLE, value: Mock.AnonymousVotingContractCollections[idx].address},
          phase: {status: RETRIEVAL_STATUS.AVAILABLE, value: VotePhases[0]},
          topic: {
            status: RETRIEVAL_STATUS.AVAILABLE,
            value: Mock.AnonymousVotingContractCollections[idx].parameters.topic
          }
        });

        const completeSummaries: IVotingContractSummary[] = Mock.addresses.map((addr, idx) => completeSummary(idx));

        const setPhaseStatus = (idx: number, status: string) => {
          return Mock.addresses.map((addr, i) => {
            const summary = completeSummary(i);
            summary.phase = i === idx ? {status: status, value: null} : summary.phase;
            return summary;
          });
        };

        const setTopicStatus = (idx: number, status: string) => {
          return Mock.addresses.map((addr, i) => {
            const summary = completeSummary(i);
            summary.topic = i === idx ? {status: status, value: null} : summary.topic;
            return summary;
          });
        };

        describe('case: one of the contracts is retrieving the phase', () => {
          it('should prevent the row from being selected', () => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setPhaseStatus(incompleteIndex, RETRIEVAL_STATUS.RETRIEVING))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);

            DOMInteractionUtility.clickOn(Page.getRows()[incompleteIndex]);
            expect(onNext).not.toHaveBeenCalled();
          });

          it('should not prevent other rows from being selected', () => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setPhaseStatus(incompleteIndex, RETRIEVAL_STATUS.RETRIEVING))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);

            Mock.addresses.map((addr, idx) => {
              if (idx !== incompleteIndex) {
                DOMInteractionUtility.clickOn(Page.getRows()[idx]);
                expect(onNext.calls.mostRecent().args[0]).toEqual(idx);
              }
            });
          });

          it('should enable the row selection once the phase is retrieved', () => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setPhaseStatus(incompleteIndex, RETRIEVAL_STATUS.RETRIEVING))
                .concat(Observable.of(completeSummaries))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);


            DOMInteractionUtility.clickOn(Page.getRows()[incompleteIndex]);
            expect(onNext).toHaveBeenCalledTimes(1);
            expect(onNext).toHaveBeenCalledWith(incompleteIndex);
          });
        });

        describe('case: one of the phases is unavailable', () => {
          beforeEach(() => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setPhaseStatus(incompleteIndex, RETRIEVAL_STATUS.UNAVAILABLE))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);
          });

          it('should prevent the row from being selected', () => {
            DOMInteractionUtility.clickOn(Page.getRows()[incompleteIndex]);
            expect(onNext).not.toHaveBeenCalled();
          });

          it('should not prevent other rows from being selected', () => {
            Mock.addresses.map((addr, idx) => {
              if (idx !== incompleteIndex) {
                DOMInteractionUtility.clickOn(Page.getRows()[idx]);
                expect(onNext.calls.mostRecent().args[0]).toEqual(idx);
              }
            });
          });
        });

        describe('case: one of the contracts is retrieving the topic', () => {

          it('should prevent the row from being selected', () => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setTopicStatus(incompleteIndex, RETRIEVAL_STATUS.RETRIEVING))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);

            DOMInteractionUtility.clickOn(Page.getRows()[incompleteIndex]);
            expect(onNext).not.toHaveBeenCalled();
          });

          it('should not prevent other rows from being selected', () => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setTopicStatus(incompleteIndex, RETRIEVAL_STATUS.RETRIEVING))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);

            Mock.addresses.map((addr, idx) => {
              if (idx !== incompleteIndex) {
                DOMInteractionUtility.clickOn(Page.getRows()[idx]);
                expect(onNext.calls.mostRecent().args[0]).toEqual(idx);
              }
            });
          });

          it('should enable the row selection once the topic is retrieved', () => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setTopicStatus(incompleteIndex, RETRIEVAL_STATUS.RETRIEVING))
                .concat(Observable.of(completeSummaries))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);


            DOMInteractionUtility.clickOn(Page.getRows()[incompleteIndex]);
            expect(onNext).toHaveBeenCalledTimes(1);
            expect(onNext).toHaveBeenCalledWith(incompleteIndex);
          });
        });

        describe('case: one of the topics is unavailable', () => {
          beforeEach(() => {
            spyOnProperty(page.voteRetrievalSvc, 'summaries$').and.returnValue(
              Observable.of(setTopicStatus(incompleteIndex, RETRIEVAL_STATUS.UNAVAILABLE))
            );
            fixture = TestBed.createComponent(ListVotesComponent);
            fixture.detectChanges();
            fixture.componentInstance.selectedContract$.subscribe(onNext, onError, onCompleted);
          });

          it('should prevent the row from being selected', () => {
            DOMInteractionUtility.clickOn(Page.getRows()[incompleteIndex]);
            expect(onNext).not.toHaveBeenCalled();
          });

          it('should not prevent other rows from being selected', () => {
            Mock.addresses.map((addr, idx) => {
              if (idx !== incompleteIndex) {
                DOMInteractionUtility.clickOn(Page.getRows()[idx]);
                expect(onNext.calls.mostRecent().args[0]).toEqual(idx);
              }
            });
          });
        });

        xit('TODO: it should change the cursor to indicate that selection is not possible');
      });
    });
  });
});


