import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { LaunchVoteComponent } from './launch-vote.component';
import { MaterialModule } from '../../material/material.module';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { IAnonymousVotingContractCollection, Mock } from '../../mock/module';


fdescribe('Component: LaunchVoteComponent', () => {
  let fixture: ComponentFixture<LaunchVoteComponent>;
  let page: Page;
  const mockVoteCollection: IAnonymousVotingContractCollection =
    Mock.AnonymousVotingContractCollections[0];

  class Page {
    public voteManagerSvc: VoteManagerService;
    public topicInput: DebugElement;

    constructor() {
      const compInjector = fixture.debugElement.injector;
      this.voteManagerSvc = compInjector.get(VoteManagerService);
      this.topicInput = fixture.debugElement.query(By.css('input[formControlName="topic"]'));
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
        {provide: VoteManagerService, useClass: Mock.VoteManagerService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(LaunchVoteComponent);
        page = new Page();
        fixture.detectChanges();
      });
  }));

  describe('User Interface', () => {
    describe('Topic Input box', () => {
      it('should exist', () => {
        expect(page.topicInput).toBeDefined();
      });

      it('should start empty', () => {
        expect(page.topicInput.nativeElement.value).toBeFalsy();
      });

      it('should have a placeholder "Topic"', () => {
        expect(page.topicInput.nativeElement.placeholder).toEqual('Topic');
      });

      it('should be a form control', () => {
        expect(page.topicInput.attributes.formControlName).toBeDefined();
      });

      describe('form control validity', () => {
        let ctrl: AbstractControl;

        beforeEach(() => {
          ctrl = page.form.get(page.topicInput.attributes.formControlName);
        });

        it('should be invalid when null', () => {
          expect(page.topicInput.nativeElement.value).toBeFalsy();
          expect(ctrl.valid).toEqual(false);
        });

        it('should be valid when populated', () => {
          Page.setInput(page.topicInput, mockVoteCollection.parameters.topic);
        });
      });
    });
  });

  describe('Functionality', () => {
    xdescribe('submit button', () => {});
  });
});


