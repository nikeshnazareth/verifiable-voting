import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { NoRestrictionContractService } from '../../core/ethereum/no-restriction-contract/contract.service';

@Component({
  selector: 'vv-launch-vote',
  templateUrl: './launch-vote.component.html'
})
export class LaunchVoteComponent implements OnInit {
  protected launchVoteForm: FormGroup;
  private minRegistrationClosesDate: Date;
  private minVotingClosesDate$: Observable<Date>;

  public constructor(private fb: FormBuilder, private noRestrictionSvc: NoRestrictionContractService) {
  }

  ngOnInit() {
    this.createForm();
  }

  private createForm() {
    this.launchVoteForm = this.fb.group({
      topic: ['', Validators.required],
      timeframes: this.fb.group({
        registrationOpens: [new Date(), Validators.required],
        registrationCloses: ['', Validators.required],
        votingCloses: ['', Validators.required]
      }),
      candidates: this.fb.array([]),
      newCandidate: [''],
      eligibility: ['', Validators.required],
      rsa_key: this.fb.group({
        modulus: ['', [Validators.required, Validators.pattern('^[0-9a-f]+$')]],
        exponent: ['10001', [Validators.required, Validators.pattern('^[0-9a-f]+$')]]
      })
    });

    this.setTimeframeRestrictions();
    this.removeEmptyCandidates();
    this.populateEligibility();
  }

  /**
   * Constrain the timeframes to ensure:
   *  - the registration phase must end the day after it opens or later
   *  - the voting phase must end :
   *    - the day after the registration closes or later if the registration deadline is defined
   *    - two days after the registration phase opens or later otherwise
   */
  private setTimeframeRestrictions() {
    this.minRegistrationClosesDate = this.dayAfter(this.launchVoteForm.get('timeframes.registrationOpens').value);

    this.minVotingClosesDate$ = this.launchVoteForm.get('timeframes.registrationCloses').valueChanges
      .startWith(null)
      .map(date => date ? date : this.minRegistrationClosesDate)
      .map(this.dayAfter);
  }

  /**
   * Whenever a particular candidate name is empty, remove the candidate
   */
  private removeEmptyCandidates() {
    this.candidates.valueChanges
      .map(controls => controls.map(ctrl => ctrl.name))
      .subscribe(names =>
        names.forEach((name, idx) => name ? null : this.candidates.removeAt(idx))
      );
  }

  /**
   * Populate the eligibility input box with the NoRestriction contract address
   */
  private populateEligibility() {
    this.noRestrictionSvc.address
      .then(addr => this.launchVoteForm.get('eligibility').setValue(addr)) // addr may be null if there was an error
      .catch(() => null); // do nothing - the NoRestrictionService will notify the error service
  }

  /**
   * Append a new FormGroup to the candidates FormArray with the contents of the
   * newCandidate input box. Then, clear the input box
   */
  private addCandidate() {
    const newCandidate: AbstractControl = this.launchVoteForm.get('newCandidate');
    if (newCandidate.value) {
      this.candidates.push(this.fb.group({name: [newCandidate.value]}));
      newCandidate.reset();
    }
  }

  /**
   * @param {Date} d the original date
   * @returns {Date} the day after the specified date
   */
  private dayAfter(d: Date) {
    const msPerDay: number = 1000 * 60 * 60 * 24;
    return new Date(d.getTime() + msPerDay);
  }

  /**
   * Syntax convenience function
   * @returns {FormArray} the candidates form array in the form
   */
  private get candidates(): FormArray {
    return <FormArray> this.launchVoteForm.get('candidates');
  }
}
