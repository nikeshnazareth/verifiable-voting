import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AbstractControl } from '@angular/forms';

import { TestLaunchVoteComponent } from './launch-vote.component.spec';
import { DOMInteractionUtility } from '../dom-interaction-utility';
import { Mock } from '../../mock/module';
import {
  INoRestrictionContractService,
  NoRestrictionContractService
} from '../../core/ethereum/no-restriction-contract/contract.service';

export function eligibility_tests(getFixture) {

  return () => {
    let fixture: ComponentFixture<TestLaunchVoteComponent>;
    let input: () => DebugElement;
    const mockEligibilityAddress: string = Mock.AnonymousVotingContractCollections[0].parameters.eligibility;

    beforeEach(() => {
      fixture = getFixture();
      // we need to wait until after fixture.detectChanges() is called to find the input
      input = () => {
        const step: DebugElement = fixture.debugElement.queryAll(By.css('.mat-step'))[3];
        return step.query(By.css('input'));
      };
    });

    it('should exist', () => {
      fixture.detectChanges();
      expect(input()).not.toBeNull();
    });

    it('should have a placeholder "Eligibility Contract"', () => {
      fixture.detectChanges();
      expect(input().nativeElement.placeholder).toEqual('Eligibility Contract');
    });

    it('should be readonly', () => {
      fixture.detectChanges();
      expect(input().attributes.readonly).toBeDefined();
    });

    it('should start empty', fakeAsync(() => {
      fixture.detectChanges();
      expect(input().nativeElement.value).toBeFalsy();
    }));

    it('should be a form control', () => {
      fixture.detectChanges();
      expect(input().attributes.formControlName).toBeDefined();
    });

    describe('form control validity', () => {
      let control: AbstractControl;

      beforeEach(() => {
        fixture.detectChanges();
        control = fixture.componentInstance.form.get(input().attributes.formControlName);
      });

      it('should be invalid when null', () => {
        DOMInteractionUtility.setValueOn(input(), '');
        fixture.detectChanges();
        expect(control.valid).toEqual(false);
      });

      it('should be valid when populated', () => {
        DOMInteractionUtility.setValueOn(input(), mockEligibilityAddress);
        fixture.detectChanges();
        expect(control.valid).toEqual(true);
      });
    });

    describe('value (obtained from the NoRestriction contract service)', () => {

      let noRestrictionSvc: INoRestrictionContractService;

      beforeEach(() => {
        noRestrictionSvc = fixture.debugElement.injector.get(NoRestrictionContractService);
      });

      describe('case: the NoRestriction contract returns the address', () => {
        it('should be populated with the NoRestriction contract address', fakeAsync(() => {
          fixture.detectChanges();
          tick();
          expect(input().nativeElement.value).toEqual(mockEligibilityAddress);
        }));
      });

      describe('case: the NoRestriction contract returns a null address', () => {
        beforeEach(() => {
          spyOnProperty(noRestrictionSvc, 'address').and.returnValue(Promise.resolve(null));
          fixture.detectChanges();
        });

        it('should be populated with null', () => {
          expect(input().nativeElement.value).toEqual('');
        });
      });

      describe('case: the NoRestriction address promise fails', () => {
        beforeEach(() => {
          spyOnProperty(noRestrictionSvc, 'address').and.returnValue(Promise.reject('Network error'));
          fixture.detectChanges();
        });

        it('should be populated with null', () => {
          expect(input().nativeElement.value).toEqual('');
        });
      });
    });
  };
}
