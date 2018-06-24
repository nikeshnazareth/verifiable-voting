
import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { AbstractControl, FormArray } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Mock } from '../../mock/module';
import { LaunchVoteComponent } from './launch-vote.component';

export function candidate_list_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<LaunchVoteComponent>;
    let step: DebugElement;
    let candidates: FormArray;
    let newCandidateInput: DebugElement;
    let mockCandidates: string[];

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      step = fixture.debugElement.queryAll(By.css('.mat-step'))[2];
      newCandidateInput = step.query(By.css('input'));
      candidates = <FormArray> fixture.componentInstance.form.get('candidates');
      mockCandidates = Mock.AnonymousVotingContractCollections[0].parameters.candidates;
    });

    const initialise_candidates = () => {
      mockCandidates.forEach(candidate => {
        DOMInteractionUtility.setValueOn(newCandidateInput, candidate);
        fixture.detectChanges();
        DOMInteractionUtility.pressKeyOn(newCandidateInput, 'Enter');
        fixture.detectChanges();
      });
    };

    const candidateElements = (): DebugElement[] => {
      return step.query(By.css('[formArrayName]')).children;
    };

    it('should start empty', () => {
      expect(candidateElements().length).toEqual(0);
    });

    it('should have an element per item in the candidates FormArray', () => {
      initialise_candidates();
      expect(candidateElements().length).toEqual(mockCandidates.length);
    });

    describe('each element', () => {
      const removeIdx: number = 1;

      beforeEach(() => {
        initialise_candidates();
      });

      it('should have an input box', () => {
        candidateElements().forEach(element => {
          expect(element.query(By.css('input'))).not.toBeNull();
        });
      });

      it('should initialise the input box with the "name" control in the form group', () => {
        const inputs: DebugElement[] = candidateElements().map(element => element.query(By.css('input')));
        inputs.forEach((input, idx) => {
          expect(input.nativeElement.value).toEqual(mockCandidates[idx]);
        });
      });

      it('should propogate changes from the input box back to the "name" control', () => {
        const inputs: DebugElement[] = candidateElements().map(element => element.query(By.css('input')));
        inputs.forEach((input, idx) => {
          const newValue: string = 'A_NEW_VALUE_' + idx;
          DOMInteractionUtility.setValueOn(input, newValue);
          fixture.detectChanges();
          expect(input.nativeElement.value).toEqual(newValue);
          expect(candidates.controls[idx].get('name').value).toEqual(newValue);
        });
      });

      it('should remove the element if the value is deleted', () => {
        DOMInteractionUtility.setValueOn(candidateElements()[removeIdx].query(By.css('input')), '');
        fixture.detectChanges();
        const remainingValues: string[] =
          candidateElements().map(element => element.query(By.css('input')).nativeElement.value);
        const expectedValues: string[] = mockCandidates.slice(0, removeIdx).concat(mockCandidates.slice(removeIdx + 1));
        expect(remainingValues).toEqual(expectedValues);
      });

      it('should remove the corresponding control if the value is deleted', () => {
        const controls: AbstractControl[] = candidates.controls.map(ctrl => ctrl); // create a shallow copy
        DOMInteractionUtility.setValueOn(candidateElements()[removeIdx].query(By.css('input')), '');
        fixture.detectChanges();
        const expected: AbstractControl[] = controls.slice(0, removeIdx).concat(controls.slice(removeIdx + 1));
        expect(candidates.controls).toEqual(expected);
      });

      it('should have a button', () => {
        candidateElements().forEach(element => {
          expect(element.query(By.css('button'))).not.toBeNull();
        });
      });

      it('should remove the element when the button is pressed', () => {
        DOMInteractionUtility.clickOn(candidateElements()[removeIdx].query(By.css('button')));
        fixture.detectChanges();
        const remainingValues: string[] =
          candidateElements().map(element => element.query(By.css('input')).nativeElement.value);
        const expectedValues: string[] = mockCandidates.slice(0, removeIdx).concat(mockCandidates.slice(removeIdx + 1));
        expect(remainingValues).toEqual(expectedValues);
      });

      it('should remove the corresponding control in the FormArray when the button is pressed', () => {
        const controls: AbstractControl[] = candidates.controls.map(ctrl => ctrl); // create a shallow copy
        DOMInteractionUtility.clickOn(candidateElements()[removeIdx].query(By.css('button')));
        fixture.detectChanges();
        const expected: AbstractControl[] = controls.slice(0, removeIdx).concat(controls.slice(removeIdx + 1));
        expect(candidates.controls).toEqual(expected);
      });
    });
  };
}
