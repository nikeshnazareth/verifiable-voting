import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { NoRestrictionContractService } from '../../core/ethereum/no-restriction-contract/contract.service';
import { address } from '../../core/ethereum/type.mappings';
import { IVoteParameters } from '../../core/ipfs/formats.interface';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';

@Component({
  selector: 'vv-launch-vote',
  templateUrl: './launch-vote.component.html',
  styleUrls: ['./launch-vote.component.scss']
})
export class LaunchVoteComponent implements OnInit {
  public form: FormGroup;
  public minRegistrationClosesDate: Date;
  public minVotingClosesDate$: Observable<Date>;

  public constructor(private fb: FormBuilder,
                     private noRestrictionSvc: NoRestrictionContractService,
                     private voteManagerSvc: VoteManagerService) {
  }

  ngOnInit() {
    this.createForm();
  }

  public createForm() {
    this.form = this.fb.group({
      topic: ['', Validators.required],
      timeframes: this.fb.group({
        registrationOpens: [new Date(), Validators.required],
        registrationCloses: ['', Validators.required],
        votingCloses: ['', Validators.required]
      }),
      candidates: this.fb.array([]),
      newCandidate: [''],
      eligibility: ['', Validators.required],
      registration_key: this.fb.group({
        modulus: ['', [Validators.required, Validators.pattern('^[0-9a-f]+$')]],
        exponent: ['10001', [Validators.required, Validators.pattern('^[0-9a-f]+$')]],
        registrationAuthority: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]]
      })
    });

    this.removeEmptyCandidates();
    this.populateEligibility();
  }

  /**
   * Pass the form values to the VoteManager service to deploy the vote
   * If successful, reset the form
   */
  public onSubmit() {
    const voteDetails = this.form.value;

    const registrationDeadline = new Date(voteDetails.timeframes.registrationCloses).getTime();
    const votingDeadline = new Date(voteDetails.timeframes.votingCloses).getTime();
    const params: IVoteParameters = {
      topic: voteDetails.topic,
      candidates: voteDetails.candidates.map(candidate => candidate.name),
      registration_key: {
        modulus: '0x' + voteDetails.registration_key.modulus,
        public_exp: '0x' + voteDetails.registration_key.exponent
      }
    };
    const eligibilityContract: address = voteDetails.eligibility;
    const registrationAuthority: address = '0x' + voteDetails.registration_key.registrationAuthority;

    this.voteManagerSvc.deployVote$(registrationDeadline, votingDeadline, params, eligibilityContract, registrationAuthority)
      .map(receipt => this.form.reset())
      .subscribe(); /// this finishes immediately so we don't need to unsubscribe
  }

  /**
   * Append a new FormGroup to the candidates FormArray with the contents of the
   * newCandidate input box. Then, clear the input box
   */
  public addCandidate() {
    const newCandidate: AbstractControl = this.form.get('newCandidate');
    if (newCandidate.value) {
      this.candidates.push(this.fb.group({name: [newCandidate.value]}));
      newCandidate.reset();
    }
  }

  /**
   * Syntax convenience function
   * @returns {FormArray} the candidates form array in the form
   */
  public get candidates(): FormArray {
    return <FormArray> this.form.get('candidates');
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
      .then(addr => this.form.get('eligibility').setValue(addr)) // addr may be null if there was an error
      .catch(() => null); // do nothing - the NoRestrictionService will notify the error service
  }
}
