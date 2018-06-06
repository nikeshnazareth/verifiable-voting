import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import { AbstractPhaseComponent } from './abstract-phase-component';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { ErrorService } from '../../core/error-service/error.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';

export const VotingStatusMessages = {
  retrieving: 'Retrieving the contract details...',
  unavailable: 'The contract details are unavailable. Please try again later',
  pending: (count) => `There are ${count} voters still waiting for the Registration Authority` +
    ' to complete their registration. Voting cannot begin until these registrations are complete.',
  notOpened: 'Voting has not yet opened',
  closed: 'Voting has closed'
};

@Component({
  selector: 'vv-voting-phase',
  templateUrl: './voting-phase-component.html',
  styleUrls: ['./voting-phase-component.scss']
})
export class VotingPhaseComponent extends AbstractPhaseComponent implements OnInit {
  protected candidates$: Observable<string[]>;

  constructor(@Inject(VoteRetrievalService) voteRetrievalSvc: VoteRetrievalService,
              private fb: FormBuilder,
              private voteManagerSvc: VoteManagerService,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    super(voteRetrievalSvc);
  }

  ngOnInit() {
    super.ngOnInit();
    this.candidates$ = this.voteDetails.map(details => details.parameters.candidates);
  }

  /**
   * Create the form controls
   */
  createForm() {
    this.form = this.fb.group({
      voterAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      anonymousAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      blindingFactor: ['', Validators.required],
      chosenCandidate: ['', Validators.required]
    });
  }

  /**
   * Pass the form values to the VoteManager service to vote
   * If successful, reset the form
   */
  handleSubmissions(): Observable<any> {
    return this.submission$
      .withLatestFrom(this.voteDetails)
      .map(val => ({form: val[0], voteDetails: val[1]}))
      .switchMap(val =>
        this.voteRetrievalSvc.blindSignatureAt$(val.voteDetails.address, val.form.voterAddress)
          .switchMap(blindedSignature => this.voteManagerSvc.voteAt$(
            val.voteDetails.address,
            val.voteDetails.parameters.registration_key,
            val.form.anonymousAddress,
            blindedSignature,
            val.form.blindingFactor,
            val.form.chosenCandidate
          ))
      )
      .map(receipt => this.form.reset());
  }

  /**
   * Determines the current Voting status of the active vote
   * (ie. whether the relevant values are all available and the contract is in the Voting phase)
   * @param {IVotingContractDetails} details the details of the active vote
   * @returns {string} a message describing the current Voting status (or null if Voting is available)
   * @private
   */
  statusMessage(details: IVotingContractDetails): string {
    const requiredParams = [
      details.registrationDeadline.status,
      details.registrationDeadline.value,
      details.votingDeadline.status,
      details.votingDeadline.value,
      details.address,
      details.parameters.registration_key.modulus,
      details.parameters.registration_key.public_exp,
      details.parameters.candidates, // for completeness, but this won't affect the check
      details.pendingRegistrations.status,
      details.pendingRegistrations.value
    ];
    const now: Date = new Date();

    if (requiredParams.includes(RETRIEVAL_STATUS.RETRIEVING)) {
      return VotingStatusMessages.retrieving;
    }
    if (requiredParams.includes(RETRIEVAL_STATUS.UNAVAILABLE) || !requiredParams.every(val => val !== null)) {
      return VotingStatusMessages.unavailable;
    }
    if (now < details.registrationDeadline.value) {
      return VotingStatusMessages.notOpened;
    }
    if (details.votingDeadline.value < now) {
      return VotingStatusMessages.closed;
    }
    if (details.pendingRegistrations.value > 0) {
      return VotingStatusMessages.pending(details.pendingRegistrations.value);
    }
    return null;
  }

  /**
   * Fill the specified control with the web3 default account or
   * raise an error if it is undefined
   * @private
   */
  private _fillAddress(ctrl: AbstractControl) {
    const account: string = this.web3Svc.defaultAccount;
    if (typeof account === 'undefined') {
      this.errSvc.add(Web3ServiceErrors.account, null);
    } else {
      ctrl.setValue(this.web3Svc.defaultAccount.slice(2));
    }
  }

}
