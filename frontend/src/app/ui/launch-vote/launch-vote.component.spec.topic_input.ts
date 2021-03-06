import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Mock } from '../../mock/module';
import { LaunchVoteComponent } from './launch-vote.component';

export function topic_input_tests(getFixture) {

  return () => {
    let input: DebugElement;
    let fixture: ComponentFixture<LaunchVoteComponent>;

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      const step: DebugElement = fixture.debugElement.queryAll(By.css('.mat-step'))[0];
      input = step.query(By.css('input'));
    });

    it('should exist', () => {
      expect(input).not.toBeNull();
    });

    it('should start empty', () => {
      expect(input.nativeElement.value).toBeFalsy();
    });

    it('should have a placeholder "Topic"', () => {
      expect(input.nativeElement.placeholder).toEqual('Topic');
    });

    it('should be a form control', () => {
      expect(input.attributes.formControlName).not.toBeNull();
    });

    describe('form control validity', () => {
      let ctrl: AbstractControl;
      let mockTopic: string;

      beforeEach(() => {
        ctrl = fixture.componentInstance.form.get(input.attributes.formControlName);
        mockTopic = Mock.AnonymousVotingContractCollections[0].parameters.topic;
      });

      it('should be invalid when null', () => {
        expect(input.nativeElement.value).toBeFalsy();
        expect(ctrl.valid).toEqual(false);
      });

      it('should be valid when populated', () => {
        DOMInteractionUtility.setValueOn(input, mockTopic);
        fixture.detectChanges();
        expect(ctrl.valid).toEqual(true);
      });
    });
  };
}
