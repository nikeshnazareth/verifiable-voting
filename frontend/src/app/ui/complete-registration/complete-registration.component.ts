import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs/index';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import 'rxjs/add/operator/map';
import { CryptographyService } from '../../core/cryptography/cryptography.service';
import { IRSAKey } from '../../core/cryptography/rsa-key.interface';
import { ErrorService } from '../../core/error-service/error.service';
import { address } from '../../core/ethereum/type.mappings';
import { Web3Errors } from '../../core/ethereum/web3-errors';
import { Web3Service } from '../../core/ethereum/web3.service';
import { RetrievalStatus } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';




@Component({
  selector: 'vv-complete-registration',
  templateUrl: './complete-registration.component.html',
  styleUrls: ['./complete-registration.component.scss']
})
export class CompleteRegistrationComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public submission$: Subject<ICompleteRegistrationForm>;
  public numCompletableRegistrations$: Observable<number>;

  private subscription: Subscription;
  private completableRegistrations$: ReplaySubject<IPendingRegistrationContext[]>;

  constructor(private fb: FormBuilder,
              private voteRetrievalSvc: VoteRetrievalService,
              private cryptoSvc: CryptographyService,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    this.submission$ = new Subject<ICompleteRegistrationForm>();
    this.completableRegistrations$ = new ReplaySubject<IPendingRegistrationContext[]>();
  }

  ngOnInit() {
    this.createForm();
    this.initCompletableRegistrations().subscribe(this.completableRegistrations$);
    this.numCompletableRegistrations$ = this.completableRegistrations$.map(L => L.length);
    this.subscription = this.handleSubmissions().subscribe();
    this.subscription.add(this.numCompletableRegistrations$.subscribe(count => {
      this.form.get('existsCompletable').setValue(count > 0);
    }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Create the form controls
   */
  createForm() {
    this.form = this.fb.group({
      regAuthAddress: ['', [Validators.required, Validators.pattern('^[0-9a-fA-F]{40}$')]],
      modulus: ['', [Validators.required, Validators.pattern('^[0-9a-f]+$')]],
      privateExponent: ['', [Validators.required, Validators.pattern('^[0-9a-f]+$')]],
      existsCompletable: [false, Validators.requiredTrue]
    });
  }

  handleSubmissions(): Observable<void> {
    return Observable.empty();
  }

  /**
   * Fill the specified control with the web3 default account or
   * raise an error if it is undefined
   */
  fillAddress(ctrl: AbstractControl) {
    const account: string = this.web3Svc.defaultAccount;
    if (typeof account === 'undefined') {
      this.errSvc.add(Web3Errors.account, null);
    } else {
      ctrl.setValue(this.web3Svc.defaultAccount.slice(2));
    }
  }

  private initCompletableRegistrations(): Observable<IPendingRegistrationContext[]> {
    const pendingRegistrations$ = this.initPendingRegistrations();
    return pendingRegistrations$.combineLatest(this.form.valueChanges, (pendingList, formValues) =>
      pendingList.filter(pending => pending.registrationAuthority === formValues.registrationAuthority)
        .filter(pending => pending.registrationKey.modulus === formValues.modulus)
        .filter(pending => this.cryptoSvc.isPrivateExponent(pending.registrationKey, formValues.privateExponent))
    )
      .startWith([]);
  }

  private initPendingRegistrations(): Observable<IPendingRegistrationContext[]> {
    return this.voteRetrievalSvc.summaries$
      .switchMap(summaries => Observable.range(0, summaries.length))
      .mergeMap(idx =>
        this.voteRetrievalSvc.detailsAtIndex$(idx)
          .filter(details =>
            details.address.status === RetrievalStatus.available &&
            details.registrationAuthority.status === RetrievalStatus.available &&
            details.key.status === RetrievalStatus.available &&
            details.pendingRegistrations.status === RetrievalStatus.available
          )
          .switchMap(details =>
            Observable.from(details.pendingRegistrations.value.map(pendingReg => pendingReg.blindedAddress))
              .map(blindedAddress => ({
                  contract: details.address.value,
                  registrationAuthority: details.registrationAuthority.value,
                  registrationKey: details.key.value,
                  blindedAddress: blindedAddress
                })
              )
          )
      )
      .scan((arr, el) => arr.concat(el), []);
  }
}

interface ICompleteRegistrationForm {
  regAuthAddress: address;
  modulus: string;
  private_exponent: string;
  existsCompletable: boolean;
}

interface IPendingRegistrationContext {
  contract: address;
  registrationAuthority: address;
  registrationKey: IRSAKey;
  blindedAddress: string;
}
