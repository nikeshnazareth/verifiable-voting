import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import { AbstractPhaseComponent } from './abstract-phase-component';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { IVotingContractDetails, RETRIEVAL_STATUS, } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { ErrorService } from '../../core/error-service/error.service';
import { CryptographyService } from '../../core/cryptography/cryptography.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';

export const RegistrationStatusMessages = {
  retrieving: 'Retrieving the contract details...',
  unavailable: 'The contract details are unavailable. Please try again later',
  closed: 'Registration has closed'
};

@Component({
  selector: 'vv-registration-phase',
  templateUrl: './registration-phase-component.html',
})
export class RegistrationPhaseComponent extends AbstractPhaseComponent {

  constructor(@Inject(VoteRetrievalService) voteRetrievalSvc: VoteRetrievalService,
              private cryptoSvc: CryptographyService,
              private voteManagerSvc: VoteManagerService,
              private fb: FormBuilder,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    super(voteRetrievalSvc);
  }

  /**
   * Create the form controls
   */
  createForm() {
    this.form = this.fb.group({
      voterAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      voterAddressAck: [false, Validators.requiredTrue],
      anonymousAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      anonymousAddressAck: [false, Validators.requiredTrue],
      blindingFactor: ['', Validators.required],
      blindingFactorSaveAck: [false, Validators.requiredTrue],
      blindingFactorProtectAck: [false, Validators.requiredTrue]
    });

    this._refreshBlindingFactor();
  }

  /**
   * Pass the form values to the VoteManager service to register the voter
   * If successful, reset the form
   */
  handleSubmissions(): Observable<any> {
    return this.submission$
      .withLatestFrom(this.voteDetails)
      .map(val => ({form: val[0], voteDetails: val[1]}))
      .switchMap(val => this.voteManagerSvc.registerAt$(
        val.voteDetails.address,
        val.voteDetails.parameters.registration_key,
        val.form.voterAddress,
        val.form.anonymousAddress,
        val.form.blindingFactor
      ))
      .map(receipt => this.form.reset());
  }

  /**
   * Determines the current Registration status of the active vote
   * (ie. whether the relevant values are all available and the contract is in the Registration phase)
   * @param {IVotingContractDetails} voteDetails the details of the active vote
   * @returns {string} a message describing the current Registration status (or null if Registration available)
   * @private
   */
  statusMessage(voteDetails: IVotingContractDetails): string {
    const requiredParams = [
      voteDetails.phase,
      voteDetails.registrationDeadline.status,
      voteDetails.registrationDeadline.value,
      voteDetails.address,
      voteDetails.parameters.registration_key.modulus,
      voteDetails.parameters.registration_key.public_exp
    ];
    const now: Date = new Date();

    if (requiredParams.includes(RETRIEVAL_STATUS.RETRIEVING)) {
      return RegistrationStatusMessages.retrieving;
    }
    if (requiredParams.includes(RETRIEVAL_STATUS.UNAVAILABLE) || !requiredParams.every(val => val !== null)) {
      return RegistrationStatusMessages.unavailable;
    }
    if (voteDetails.phase !== VotePhases[0] || voteDetails.registrationDeadline.value < now) {
      return RegistrationStatusMessages.closed;
    }
    return null;
  }

  /**
   * Set the blinding factor to a new 33-byte random string (in base64)
   * @private
   */
  private _refreshBlindingFactor() {
    this.form.controls.blindingFactor.setValue(this.cryptoSvc.random(33));
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
