import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';

import { IVoteParameters, VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { DOMInteractionUtility } from '../../mock/dom-interaction-utility';
import { Mock } from '../../mock/module';
import { LaunchVoteComponent } from './launch-vote.component';

export function submit_button_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<LaunchVoteComponent>;
    let buttons: DebugElement [];
    let button: DebugElement;
    let form: FormGroup;
    let fb: FormBuilder;
    let voteManagerSvc: VoteManagerService;
    const voteDetails = Mock.AnonymousVotingContractCollections[0];

    beforeEach(() => {
      fixture = getFixture();
      buttons = fixture.debugElement.queryAll(By.css('button[type="submit"]'));
      button = buttons[0];
      voteManagerSvc = fixture.debugElement.injector.get(VoteManagerService);
      fb = fixture.debugElement.injector.get(FormBuilder);
    });

    const populateForm = () => {
      fixture.detectChanges();
      form = fixture.componentInstance.form;

      const timeframes: FormGroup = <FormGroup> form.controls.timeframes;
      const candidates: FormArray = <FormArray> form.controls.candidates;
      const registration_key: FormGroup = <FormGroup> form.controls.registration_key;

      form.controls.topic.patchValue(voteDetails.parameters.topic);
      timeframes.controls.registrationCloses.patchValue(new Date(voteDetails.voteConstants.registrationDeadline));
      timeframes.controls.votingCloses.patchValue(new Date(voteDetails.voteConstants.votingDeadline));
      voteDetails.parameters.candidates.forEach(candidate => {
        candidates.push(fb.group({name: [candidate]}));
      });
      form.controls.eligibility.patchValue(voteDetails.voteConstants.eligibilityContract);
      registration_key.controls.modulus.patchValue(voteDetails.parameters.registration_key.modulus);
      registration_key.controls.exponent.patchValue(voteDetails.parameters.registration_key.public_exp);
      registration_key.controls.registrationAuthority.patchValue(voteDetails.voteConstants.registrationAuthority);
      fixture.detectChanges();
    };

    it('should exist', () => {
      fixture.detectChanges();
      expect(button).toBeDefined();
    });

    it('should be the only one', () => {
      fixture.detectChanges();
      expect(buttons.length).toEqual(1);
    });

    it('should be disabled when the form is invalid', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.form.valid).toEqual(false);
      expect(button.nativeElement.disabled).toEqual(true);
    });

    it('should be enabled when the form is valid', () => {
      populateForm();
      expect(form.valid).toEqual(true);
      expect(button.nativeElement.disabled).toEqual(false);
    });

    describe('form submission', () => {

        beforeEach(() => {
          populateForm();
        });

        it('should pass the form details to the VoteManager service', () => {
          spyOn(voteManagerSvc, 'deployVote$').and.callThrough();
          DOMInteractionUtility.clickOn(button);
          const params: IVoteParameters = {
            topic: voteDetails.parameters.topic,
            candidates: voteDetails.parameters.candidates,
            registration_key: {
              modulus: '0x' + voteDetails.parameters.registration_key.modulus,
              public_exp: '0x' + voteDetails.parameters.registration_key.public_exp
            }
          };

          expect(voteManagerSvc.deployVote$).toHaveBeenCalledWith(
            voteDetails.voteConstants.registrationDeadline,
            voteDetails.voteConstants.votingDeadline,
            params,
            voteDetails.voteConstants.eligibilityContract,
            '0x' + voteDetails.voteConstants.registrationAuthority
          );
        });

        describe('case: VoteManager service returns a transaction receipt', () => {
          it('should reset the form', () => {
            form.markAsDirty();
            DOMInteractionUtility.clickOn(button);
            expect(form.pristine).toEqual(true);
          });
        });

        describe('case: VoteManager service returns an empty observable', () => {
          beforeEach(() => {
            spyOn(voteManagerSvc, 'deployVote$').and.returnValue(Observable.empty());
          });

          it('should not reset the form', () => {
            form.markAsDirty();
            DOMInteractionUtility.clickOn(button);
            expect(form.pristine).toEqual(false);
          });
        });
      }
    );
  }
    ;
}
