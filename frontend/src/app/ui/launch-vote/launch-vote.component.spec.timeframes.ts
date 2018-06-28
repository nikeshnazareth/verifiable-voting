import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LaunchVoteComponent } from './launch-vote.component';

export function timeframe_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<LaunchVoteComponent>;
    let timeframes: DebugElement[];

    beforeEach(() => {
      fixture = getFixture();
      fixture.detectChanges();
      const step: DebugElement = fixture.debugElement.queryAll(By.css('.mat-step'))[1];
      timeframes = step.queryAll(By.css('vv-datetime-picker'));
    });

    it('should have three datetime pickers', () => {
      expect(timeframes.length).toEqual(3);
    });

    describe('First datetime picker', () => {
      let dtpicker: DebugElement;

      beforeEach(() => {
        dtpicker = timeframes[0];
      });

      xit('should have placeholder "Registration Opens"');

      xit('TODO: should be initialised to the current datetime');

      xit('should be readonly');

      it('should be a form control', () => {
        expect(dtpicker.attributes.formControlName).toBeDefined();
      });

      describe('form control validity', () => {
        xit('should be invalid when set to null');

        xit('should be valid when populated');
      });
    });

    describe('Second datetime picker', () => {
      let dtpicker: DebugElement;

      beforeEach(() => {
        dtpicker = timeframes[1];
      });

      xit('should have placeholder "Registration Closes"');

      xit('should start empty');

      xit('should have a minimum value of one minute after the Registration Opens datetime picker');

      it('should be a form control', () => {
        expect(dtpicker.attributes.formControlName).not.toBeNull();
      });

      describe('form control validity', () => {
        xit('should be invalid when set to null');

        xit('should be invalid when set to before the minimum value');

        xit('should be valid when set to the minimum value');

        xit('should be valid when set to after the minimum value');
      });
    });

    describe('Third datetime picker', () => {
      let dtpicker: DebugElement;

      beforeEach(() => {
        dtpicker = timeframes[2];
      });

      xit('should have placeholder "Voting Closes"');

      xit('should start empty');

      describe('case: the Registration Closes datetime picker is null', () => {
        xit('should have a minimum value of one minute after the Registration Opens datetime picker');
      });

      describe('case: the Registration Closes datetime picker is set', () => {
        xit('should have a minimum value of one minute after the Registration Closes datetime picker');
      });

      it('should be a form control', () => {
        expect(dtpicker.attributes.formControlName).not.toBeNull();
      });

      describe('form control validity', () => {
        xit('should be invalid when set to null');

        xit('should be invalid when set to before the minimum value');

        xit('should be valid when set to the minimum value');

        xit('should be valid when set to after the minimum value');
      });
    });
  };
}
