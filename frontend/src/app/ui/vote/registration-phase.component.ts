import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { VotePhases } from '../../core/ethereum/anonymous-voting-contract/contract.api';
import { IVotingContractDetails, RETRIEVAL_STATUS } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { ErrorService } from '../../core/error-service/error.service';

export const RegistrationPhaseComponentMessages = {
  retrieving: 'Retrieving the contract details...',
  unavailable: 'The contract details are unavailable. Please try again later',
  closed: 'Registration has closed'
};

@Component({
  selector: 'vv-registration-phase',
  template: `
    <div id="register" *ngIf="_inRegistrationPhase$ | async; else unavailable">
      <form (ngSubmit)="onSubmit()" [formGroup]=registerForm>
        <div>
          0x
          <mat-form-field>
            <input matInput formControlName="voterAddress" placeholder="Public Address">
          </mat-form-field>
          <button mat-button color="primary" type="button" id="fillVoterAddress" (click)="_fillVoterAddress()">
            Use Active Account
          </button>
        </div>
        <div>
          <mat-checkbox formControlName="voterAddressAck"></mat-checkbox>
          <b>I ACKNOWLEDGE</b> that this is a public address.
          It will be used to prove I am eligible to vote.
        </div>
        <mat-divider></mat-divider>
        <div>
          0x
          <mat-form-field>
            <input matInput formControlName="anonymousAddress" placeholder="Anonymous Address">
          </mat-form-field>
          <button mat-button color="primary" type="button" id="fillAnonymousAddress" (click)="_fillAnonymousAddress()">
            Use Active Account
          </button>
        </div>
        <div>
          <mat-checkbox formControlName="anonymousAddressAck"></mat-checkbox>
          <b>I ACKNOWLEDGE</b> that this address will be publicly associated with my vote and should, therefore,
          remain anonymous.<br/>
          It is recommended to create a new account specifically for this vote, never use it for any other purpose, 
          and never reveal it to anyone.
        </div>
      </form>
    </div>
    <ng-template #unavailable>
      <div id="unavailable">{{_message$ | async}}</div>
    </ng-template>
  `,
})
export class RegistrationPhaseComponent implements OnInit {
  protected registerForm: FormGroup;
  private _index$: BehaviorSubject<number>;
  private _inRegistrationPhase$: Observable<boolean>;
  private _message$: Observable<string>;

  constructor(private voteRetrievalSvc: VoteRetrievalService,
              private fb: FormBuilder,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    this._index$ = new BehaviorSubject<number>(null);
  }

  /**
   * Initialise the observables used by the view
   */
  ngOnInit() {
    const _voteDetails$: Observable<IVotingContractDetails> = this._index$
      .switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx))
      .shareReplay(1);

    this._inRegistrationPhase$ = _voteDetails$.map(details => this._inRegistrationPhase(details));
    this._message$ = _voteDetails$.filter(details => !this._inRegistrationPhase(details))
      .map(details => this._chooseMessage(details));

    this.createForm();
  }

  private createForm() {
    this.registerForm = this.fb.group({
      voterAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      voterAddressAck: [false, Validators.requiredTrue],
      anonymousAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      anonymousAddressAck: [false, Validators.requiredTrue]
    });
  }

  /**
   * Convert the input "index" into an observable
   * @param val
   */
  @Input()
  set index(val: number) {
    this._index$.next(val);
  }

  /**
   * Fill the public voter address with the web3 default account or
   * raise an error if it is undefined
   * @private
   */
  private _fillVoterAddress() {
    this._fillAddress(this.registerForm.get('voterAddress'));
  }

  /**
   * Fill the anonymous voter address with the web3 default account or
   * raise an error if it is undefined
   * @private
   */
  private _fillAnonymousAddress() {
    this._fillAddress(this.registerForm.get('anonymousAddress'));
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

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the vote is in the Registration phase
   * @private
   */
  private _inRegistrationPhase(voteDetails: IVotingContractDetails): boolean {
    const now = new Date();
    return voteDetails.phase === VotePhases[0] &&
      voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.AVAILABLE &&
      voteDetails.registrationDeadline.value &&
      now < voteDetails.registrationDeadline.value;
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {string} the message to display to the user explaining why they cannot register at the moment
   * @private
   */
  private _chooseMessage(voteDetails: IVotingContractDetails): string {
    if (this._isRetrieving(voteDetails)) {
      return RegistrationPhaseComponentMessages.retrieving;
    } else if (this._isUnavailable(voteDetails)) {
      return RegistrationPhaseComponentMessages.unavailable;
    } else if (this._regDeadlinePassed(voteDetails) || voteDetails.phase !== VotePhases[0]) {
      return RegistrationPhaseComponentMessages.closed;
    } else {
      return null;
    }
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the vote phase or registration deadline are still being retrieved
   * @private
   */
  private _isRetrieving(voteDetails: IVotingContractDetails): boolean {
    return voteDetails.phase === RETRIEVAL_STATUS.RETRIEVING ||
      voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.RETRIEVING;
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the vote phase or registration deadline are unavailable
   * @private
   */
  private _isUnavailable(voteDetails: IVotingContractDetails): boolean {
    return voteDetails.phase === RETRIEVAL_STATUS.UNAVAILABLE ||
      voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.UNAVAILABLE;
  }

  /**
   * @param {IVotingContractDetails} voteDetails the details corresponding to the selected AnonymousVoting contract
   * @returns {boolean} whether the registration deadline has already passed
   * @private
   */
  private _regDeadlinePassed(voteDetails: IVotingContractDetails): boolean {
    const now: Date = new Date();
    return voteDetails.registrationDeadline.status === RETRIEVAL_STATUS.AVAILABLE &&
      voteDetails.registrationDeadline.value &&
      voteDetails.registrationDeadline.value < now;
  }
}
