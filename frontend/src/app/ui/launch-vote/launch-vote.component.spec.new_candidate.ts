import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Mock } from '../../mock/module';
import { LaunchVoteComponent } from './launch-vote.component';

export function new_candidate_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<LaunchVoteComponent>;
    let step: DebugElement;
    let input: DebugElement;
    let candidates: FormArray;
    let mockCandidates: string[];

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      step = fixture.debugElement.queryAll(By.css('.mat-step'))[2];
      input = step.query(By.css('input'));
      candidates = <FormArray> fixture.componentInstance.form.get('candidates');
      mockCandidates = Mock.AnonymousVotingContractCollections[0].parameters.candidates;
    });

    describe('Input box', () => {

      it('should exist', () => {
        expect(input).not.toBeNull();
      });

      it('should start empty', () => {
        expect(input.nativeElement.value).toBeFalsy();
      });

      it('should have a placeholder "New Candidate"', () => {
        expect(input.nativeElement.placeholder).toEqual('New Candidate');
      });

      // A set of tests that will be executed twice, once for each input mechanism
      const input_candidate_tests = (inputMechanism: (value) => void) => {
        describe('case: the input box is populated', () => {
          it('should create a new formgroup in the "candidates" FormArray', () => {
            expect(candidates.controls.length).toEqual(0);

            inputMechanism(mockCandidates[0]);
            expect(candidates.controls.length).toEqual(1);

            inputMechanism(mockCandidates[1]);
            expect(candidates.controls.length).toEqual(2);
          });

          it('should populate the "name" control of the new formgroup with the contents of the input box', () => {
            inputMechanism(mockCandidates[0]);
            expect(candidates.controls[0].get('name').value).toEqual(mockCandidates[0]);
          });

          it('should clear the input box', () => {
            inputMechanism(mockCandidates[0]);
            expect(input.nativeElement.value).toBeFalsy();
          });
        });

        describe('case: the input box is empty', () => {
          it('should not affect the "candidates" FormArray', () => {
            inputMechanism(mockCandidates[0]);
            expect(candidates.controls.length).toEqual(1);
            inputMechanism('');
            expect(candidates.controls.length).toEqual(1);
          });
        });
      };

      describe('case: enter is pressed', () => {
        const inputCandidateWithEnterKey = (value) => {
          DOMInteractionUtility.setValueOn(input, value);
          fixture.detectChanges();
          DOMInteractionUtility.pressKeyOn(input, 'Enter');
          fixture.detectChanges();
        };

        input_candidate_tests(inputCandidateWithEnterKey);
      });

      // it should mirror the effects of pressing enter on the input box
      describe('case: the button is pressed', () => {
        let newCandidateButton: DebugElement;

        beforeEach(() => {
          const buttons: DebugElement[] = step.queryAll(By.css('button'));
          newCandidateButton = buttons[buttons.length - 1];
        });

        const inputCandidateWithButton = (value) => {
          DOMInteractionUtility.setValueOn(input, value);
          fixture.detectChanges();
          DOMInteractionUtility.clickOn(newCandidateButton);
          fixture.detectChanges();
        };
        input_candidate_tests(inputCandidateWithButton);
      });
    });
  };
}
