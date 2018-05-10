import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { OnInit } from '@angular/core';

import { LaunchVoteComponent } from './launch-vote.component';
import { MaterialModule } from '../../material/material.module';
import { NoRestrictionContractService } from '../../core/ethereum/no-restriction-contract/contract.service';
import { Mock } from '../../mock/module';
import { topic_input_tests } from './launch-vote.component.spec.topic_input';
import { timeframe_tests } from './launch-vote.component.spec.timeframes';
import { new_candidate_tests } from './launch-vote.component.spec.new_candidate';
import { candidate_list_tests } from './launch-vote.component.spec.candidate_list';
import { eligibility_tests } from './launch-vote.component.spec.eligibility';

describe('Component: LaunchVoteComponent', () => {
  let fixture: ComponentFixture<TestLaunchVoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestLaunchVoteComponent
      ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
      ],
      providers: [
        {provide: NoRestrictionContractService, useClass: Mock.NoRestrictionContractService}
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TestLaunchVoteComponent);
      });
  }));

  describe('User Interface', () => {

    describe('Topic Input box', topic_input_tests(() => fixture));

    describe('Timeframe control group', timeframe_tests(() => fixture));

    describe('New Candidate components', new_candidate_tests(() => fixture));

    describe('Candidate list', candidate_list_tests(() => fixture));

    describe('Eligibility input box', eligibility_tests(() => fixture));
  });

  describe('Functionality', () => {
    xdescribe('submit button', () => {
    });
  });
});

/**
 * Class to expose private values for testing purposes
 * It is more correct to confirm the functionality using only public values
 * but testing form validation is a lot easier if we can see the validators directly
 * (instead of testing their effects, which cannot be isolated,
 *  since they relevant affects are synthesised across many components )
 */
export class TestLaunchVoteComponent extends LaunchVoteComponent implements OnInit {
  public form: FormGroup;

  ngOnInit() {
    super.ngOnInit();
    this.form = this.launchVoteForm;
  }
}
