import { ComponentFixture } from '@angular/core/testing';
import { FormArray, FormGroup } from '@angular/forms';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { TestLaunchVoteComponent } from './launch-vote.component.spec';
import { DOMInteractionUtility } from '../dom-interaction-utility';
import { Mock } from '../../mock/module';

export function new_candidate_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<TestLaunchVoteComponent>;
    let input: DebugElement;
    let candidates: FormArray;
    let mockCandidates: string[];

    beforeEach(() => {
      fixture = getFixture();
      input = fixture.debugElement.query(By.css('input[formControlName="newCandidate"]'));
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
          newCandidateButton = fixture.debugElement.query(By.css('#addCandidateButton'));
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
