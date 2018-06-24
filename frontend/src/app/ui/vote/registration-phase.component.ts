import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { CryptographyService, IRSAKey } from '../../core/cryptography/cryptography.service';
import { ErrorService } from '../../core/error-service/error.service';
import { address } from '../../core/ethereum/type.mappings';
import { Web3Service, Web3ServiceErrors } from '../../core/ethereum/web3.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';

@Component({
  selector: 'vv-registration-phase',
  templateUrl: './registration-phase-component.html',
  styleUrls: ['./registration-phase-component.scss']
})
export class RegistrationPhaseComponent implements OnInit, OnDestroy {
  @Input() contract: address;
  @Input() key: IRSAKey;

  public form: FormGroup;
  public submission$: Subject<IRegistrationForm>;

  private subscription: Subscription;

  constructor(private cryptoSvc: CryptographyService,
              private voteManagerSvc: VoteManagerService,
              private fb: FormBuilder,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    this.submission$ = new Subject<IRegistrationForm>();
  }

  ngOnInit() {
    this.createForm();
    this.subscription = this.handleSubmissions().subscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

    this.refreshBlindingFactor();
  }

  /**
   * Pass the form values to the VoteManager service to register the voter
   * If successful, reset the form
   */
  handleSubmissions(): Observable<void> {
    return this.submission$
      .switchMap(form => this.voteManagerSvc.registerAt$(
        this.contract,
        this.key,
        form.voterAddress,
        form.anonymousAddress,
        form.blindingFactor
      ))
      .map(receipt => this.form.reset());
  }

  /**
   * Set the blinding factor to a new 33-byte random string (in base64)
   */
  refreshBlindingFactor() {
    this.form.controls.blindingFactor.setValue(this.cryptoSvc.random(33));
  }

  /**
   * Fill the specified control with the web3 default account or
   * raise an error if it is undefined
   */
  fillAddress(ctrl: AbstractControl) {
    const account: string = this.web3Svc.defaultAccount;
    if (typeof account === 'undefined') {
      this.errSvc.add(Web3ServiceErrors.account, null);
    } else {
      ctrl.setValue(this.web3Svc.defaultAccount.slice(2));
    }
  }
}

interface IRegistrationForm {
  voterAddress: address;
  anonymousAddress: address;
  blindingFactor: string;
}
