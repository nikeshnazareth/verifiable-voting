import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/index';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';
import { CryptographyService } from '../../core/cryptography/cryptography.service';
import { IRSAKey } from '../../core/cryptography/rsa-key.interface';
import { ErrorService } from '../../core/error-service/error.service';
import { address } from '../../core/ethereum/type.mappings';
import { Web3Errors } from '../../core/ethereum/web3-errors';
import { Web3Service } from '../../core/ethereum/web3.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { RetrievalStatus } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';
import { EthereumAddressValidator } from '../../validators/ethereum-address.validator';
import { LowercaseHexValidator } from '../../validators/lowercase-hex.validator';


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
  private completableRegistrations$: BehaviorSubject<IPendingRegistrationContext[]>;

  constructor(private fb: FormBuilder,
              private voteRetrievalSvc: VoteRetrievalService,
              private voteManagerSvc: VoteManagerService,
              private cryptoSvc: CryptographyService,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    this.submission$ = new Subject<ICompleteRegistrationForm>();
    this.completableRegistrations$ = new BehaviorSubject<IPendingRegistrationContext[]>([]);
  }

  ngOnInit() {
    this.createForm();
    this.initCompletableRegistrations().subscribe(this.completableRegistrations$);
    this.numCompletableRegistrations$ = this.completableRegistrations$.map(L => L.length);

    this.subscription = this.handleSubmissions().subscribe();
    this.subscription.add(this.numCompletableRegistrations$.subscribe(count => {
      const ctrl = this.form.get('existsCompletable');
      if (ctrl.value !== (count > 0)) {
        ctrl.setValue(count > 0);
      }
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
      regAuthAddress: ['', [Validators.required, EthereumAddressValidator.validate]],
      modulus: ['', [Validators.required, LowercaseHexValidator.validate]],
      privateExponent: ['', [Validators.required, LowercaseHexValidator.validate]],
      existsCompletable: [false, Validators.requiredTrue]
    });
  }

  /**
   * Pass the form values and with the completable pending registrations to the VoteManager service to complete the registrations
   * Reset the form
   * @returns {Observable<void>}
   */
  handleSubmissions(): Observable<void> {
    return this.submission$
      .withLatestFrom(this.completableRegistrations$, (form, pendingRegContexts) =>
        Observable.from(pendingRegContexts)
          .switchMap(pendingRegCtx => this.voteManagerSvc.completeRegistrationAt$(
            pendingRegCtx.contract,
            pendingRegCtx.voter,
            pendingRegCtx.registrationAuthority,
            pendingRegCtx.registrationKey,
            form.privateExponent,
            pendingRegCtx.blindedAddress
          ))
      )
      .switch()
      .do(() => this.form.reset());
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
    const normalisedForm = this.form.valueChanges.map(values => {
      for (const param in values) {
        if (values.hasOwnProperty(param) && param !== 'existsCompletable') {
          values[param] = values[param] ? values[param] : '';
          values[param] = '0x' + values[param].toLowerCase();
        }
      }
      return values;
    });

    return pendingRegistrations$.combineLatest(normalisedForm, (pendingList, formValues) =>
      pendingList.filter(pending => pending.registrationAuthority === formValues.regAuthAddress)
        .filter(pending => pending.registrationKey.modulus === formValues.modulus)
        .filter(pending => this.cryptoSvc.isPrivateExponent(pending.registrationKey, formValues.privateExponent))
    );
  }

  private initPendingRegistrations(): Observable<IPendingRegistrationContext[]> {
    return this.voteRetrievalSvc.summaries$
      .pipe(this.maxRange)
      .mergeMap(idx =>
        this.voteRetrievalSvc.detailsAtIndex$(idx)
          .filter(details =>
            details.address.status === RetrievalStatus.available &&
            details.registrationAuthority.status === RetrievalStatus.available &&
            details.key.status === RetrievalStatus.available &&
            details.pendingRegistrations.status === RetrievalStatus.available
          )
          .take(1)
          .switchMap(details =>
            Observable.from(details.pendingRegistrations.value)
              .map(pending => ({
                  contract: details.address.value,
                  registrationAuthority: details.registrationAuthority.value,
                  registrationKey: details.key.value,
                  voter: pending.voter,
                  blindedAddress: pending.blindedAddress
                })
              )
          )
      )
      .scan((arr, el) => arr.concat(el), []);
  }

  /**
   * Each time the source is observed, count from the previous value (initially starting at 0) until we reach the new maximum length
   * This operator ignores elements emitted by the source that are shorter than the lengths emitted already
   * @param {Observable<T[]>} source an observable of arrays
   * @returns {Observable<number>} the range from 0 to N-1 where N is the length of the largest array emitted by "source" so far
   */
  private maxRange<T>(source: Observable<T[]>): Observable<number> {
    let max: number = 0;
    return new Observable(observer => source.subscribe(
      (val) => {
        for (let i = max; i < val.length; i++) {
          observer.next(i);
        }
        max = Math.max(max, val.length);
      },
      (err) => observer.error(err),
      () => observer.complete()
    ));
  }
}

interface ICompleteRegistrationForm {
  regAuthAddress: address;
  modulus: string;
  privateExponent: string;
  existsCompletable: boolean;
}

interface IPendingRegistrationContext {
  contract: address;
  registrationAuthority: address;
  registrationKey: IRSAKey;
  voter: address;
  blindedAddress: string;
}
