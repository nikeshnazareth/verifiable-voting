import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { IRSAKey } from '../../../core/cryptography/rsa-key.interface';
import { ErrorService } from '../../../core/error-service/error.service';
import { address } from '../../../core/ethereum/type.mappings';
import { Web3Errors } from '../../../core/ethereum/web3-errors';
import { Web3Service } from '../../../core/ethereum/web3.service';
import { VoteManagerService } from '../../../core/vote-manager/vote-manager.service';
import { IDynamicValue, ISingleRegistration } from '../../../core/vote-retrieval/vote-retreival.service.constants';
import { EthereumAddressValidator } from '../../../validators/ethereum-address.validator';

@Component({
  selector: 'vv-voting-phase',
  templateUrl: './voting-phase-component.html',
  styleUrls: ['./voting-phase-component.scss']
})
export class VotingPhaseComponent implements OnInit, OnDestroy {
  @Input() contract: address;
  @Input() key: IRSAKey;
  @Input() candidates: string[];
  @Input() registration: Observable<Observable<IDynamicValue<ISingleRegistration>>>;

  public form: FormGroup;
  public submission$: Subject<IVotingForm>;

  private subscription: Subscription;


  constructor(private fb: FormBuilder,
              private voteManagerSvc: VoteManagerService,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    this.submission$ = new Subject<IVotingForm>();
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
      voterAddress: ['', [Validators.required, EthereumAddressValidator.validate]],
      anonymousAddress: ['', [Validators.required, EthereumAddressValidator.validate]],
      blindingFactor: ['', Validators.required],
      chosenCandidate: ['', Validators.required]
    });
  }

  /**
   * Pass the form values to the VoteManager service to vote
   * If successful, reset the form
   */
  handleSubmissions(): Observable<void> {
    return this.submission$
      .switchMap(form => this.registration
        .mergeMap(voterReg$ => voterReg$.last())
        .filter(voterReg => voterReg.value.voter === `0x${form.voterAddress}`)
        .map(voterReg => voterReg.value.blindSignature)
        .take(1)
        .switchMap(blindSig =>
          this.voteManagerSvc.voteAt$(
            this.contract,
            this.key,
            `0x${form.anonymousAddress}`,
            blindSig,
            form.blindingFactor,
            form.chosenCandidate
          )
        )
      )
      .map(() => this.form.reset());
  }

  /**
   * Fill the specified control with the web3 default account or
   * raise an error if it is undefined
   */
  fillAddress(ctrl: AbstractControl) {
    this.web3Svc.defaultAccount$
      .subscribe(account => {
        if (typeof account === 'undefined' || account === null) {
          this.errSvc.add(Web3Errors.account, null);
        } else {
          ctrl.setValue(account.slice(2));
        }
      });
  }
}

interface IVotingForm {
  voterAddress: address;
  anonymousAddress: address;
  blindingFactor: string;
  chosenCandidate: number;
}
