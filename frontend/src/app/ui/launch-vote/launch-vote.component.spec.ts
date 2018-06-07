import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { LaunchVoteComponent } from './launch-vote.component';
import { MaterialModule } from '../../material/material.module';
import { NoRestrictionContractService } from '../../core/ethereum/no-restriction-contract/contract.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { Mock } from '../../mock/module';

import { topic_input_tests } from './launch-vote.component.spec.topic_input';
import { timeframe_tests } from './launch-vote.component.spec.timeframes';
import { new_candidate_tests } from './launch-vote.component.spec.new_candidate';
import { candidate_list_tests } from './launch-vote.component.spec.candidate_list';
import { eligibility_tests } from './launch-vote.component.spec.eligibility';
import { registration_key_tests } from './launch-vote.component.spec.registration_key';
import { submit_button_tests } from './launch-vote-component.spec.submit';

describe('Component: LaunchVoteComponent', () => {
  let fixture: ComponentFixture<LaunchVoteComponent>;

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
        {provide: NoRestrictionContractService, useClass: Mock.NoRestrictionContractService},
        {provide: VoteManagerService, useClass: Mock.VoteManagerService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(LaunchVoteComponent);
      });
  }));

  describe('User Interface', () => {

    describe('Vertical Stepper', () => {
      let stepper: DebugElement;

      beforeEach(() => {
        fixture.detectChanges();
        stepper = fixture.debugElement.query(By.css('mat-vertical-stepper'));
      });

      it('should exist', () => {
        expect(stepper).not.toBeNull();
      });

      describe('steps', () => {
        let labels: string[];

        beforeEach(() => {
          const steps: DebugElement[] = stepper.queryAll(By.css('.mat-step'));
          labels = steps.map(step => step.query(By.css('.mat-step-text-label')).nativeElement.innerText);
        });

        it('should have five steps', () => {
          expect(labels.length).toEqual(5);
        });

        it('should label the first step "Topic"', () => {
          expect(labels[0]).toEqual('Topic');
        });

        it('should label the second step "Timeframes"', () => {
          expect(labels[1]).toEqual('Timeframes');
        });

        it('should label the third step "Candidates"', () => {
          expect(labels[2]).toEqual('Candidates');
        });

        it('should label the fourth step "Eligibility Criteria"', () => {
          expect(labels[3]).toEqual('Eligibility Criteria');
        });

        it('should label the fifth step "Registration Authority"', () => {
          expect(labels[4]).toEqual('Registration Authority');
        });
      });
    });

    describe('Topic Input box', topic_input_tests(() => fixture));

    describe('Timeframe control group', timeframe_tests(() => fixture));

    describe('New Candidate components', new_candidate_tests(() => fixture));

    describe('Candidate list', candidate_list_tests(() => fixture));

    describe('Eligibility input box', eligibility_tests(() => fixture));

    describe('Registration key', registration_key_tests(() => fixture));
  });

  describe('Functionality', () => {
    describe('Submit button', submit_button_tests(() => fixture));
  });
});
