import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReplaySubject, Subscription } from 'rxjs/index';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import { map, scan, switchAll, switchMap, take } from 'rxjs/operators';
import { CryptographyService } from '../../core/cryptography/cryptography.service';
import { IRSAKey } from '../../core/cryptography/rsa-key.interface';
import { ErrorService } from '../../core/error-service/error.service';
import { address } from '../../core/ethereum/type.mappings';
import { Web3Errors } from '../../core/ethereum/web3-errors';
import { Web3Service } from '../../core/ethereum/web3.service';
import { VoteManagerService } from '../../core/vote-manager/vote-manager.service';
import { IVotingContractDetails, RetrievalStatus } from '../../core/vote-retrieval/vote-retreival.service.constants';
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
  public validForm$: Observable<boolean>;

  private subscription: Subscription;
  private completableRegistrations$: ReplaySubject<IPendingRegistrationContext[]>;

  constructor(private fb: FormBuilder,
              private voteRetrievalSvc: VoteRetrievalService,
              private voteManagerSvc: VoteManagerService,
              private cryptoSvc: CryptographyService,
              private web3Svc: Web3Service,
              private errSvc: ErrorService) {
    this.submission$ = new Subject<ICompleteRegistrationForm>();
    this.completableRegistrations$ = new ReplaySubject<IPendingRegistrationContext[]>();
  }

  ngOnInit() {
    this.createForm();

    this.subscription = this.initCompletableRegistrations$().subscribe(this.completableRegistrations$);
    this.numCompletableRegistrations$ = this.completableRegistrations$.pipe(map(completable => completable.length));
    this.validForm$ = this.form.valueChanges.combineLatest(this.numCompletableRegistrations$,
      (_, N) => this.form.valid && N > 0
    );
    this.subscription.add(this.handleSubmissions().subscribe());
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
      privateExponent: ['', [Validators.required, LowercaseHexValidator.validate]]
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
          .pipe(take(1))
          .pipe(switchMap(pendingRegCtx =>
            this.voteManagerSvc.completeRegistrationAt$(
              pendingRegCtx.contract,
              pendingRegCtx.voter,
              pendingRegCtx.registrationAuthority,
              pendingRegCtx.registrationKey,
              `0x${form.privateExponent}`,
              pendingRegCtx.blindedAddress
            )
          ))
      )
      .switch();
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

  /**
   * Normalise the form values so that all addresses are lowercase and start with 0x
   */
  private normalisedForm$(): Observable<ICompleteRegistrationForm> {
    return this.form.valueChanges.map(values => {
      const normalised = Object.assign({}, values);
      for (const param in normalised) {
        if (normalised.hasOwnProperty(param)) {
          normalised[param] = normalised[param] ? normalised[param] : '';
          normalised[param] = `0x${normalised[param].toLowerCase()}`;
        }
      }
      return normalised;
    });
  }

  /**
   * @returns {Observable<IPendingRegistrationContext[]>} The completable pending registration contexts
   * The outer observable corresponds to the form values. Each time they are updated, emit an observable
   * with all the pending contexts
   */
  private initCompletableRegistrations$(): Observable<IPendingRegistrationContext[]> {
    const normalisedForm$ = this.normalisedForm$();
    const availableVotes$ = new ReplaySubject<IVotingContractDetails>();
    this.voteRetrievalSvc.summaries$
      .pipe(this.maxRange)
      .mergeMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx)
        .filter(details => details.address.status === RetrievalStatus.available)
        .filter(details => details.registrationAuthority.status === RetrievalStatus.available)
        .filter(details => details.key.status === RetrievalStatus.available)
        .take(1)
      ).subscribe(availableVotes$);

    return normalisedForm$.switchMap(formValues =>
      // an observable of all the matching IPendingRegistrationContext objects
      availableVotes$
      // ensure the vote matches the form details
      // Note: we cannot use a filter because it should revert to non-completable if a previously valid value is changed
        .pipe(switchMap(details =>
          details.registrationAuthority.value === formValues.regAuthAddress &&
          details.key.value.modulus === formValues.modulus &&
          this.cryptoSvc.isPrivateExponent(details.key.value, formValues.privateExponent) ?
            Observable.of(details) :
            Observable.of(null)
        ))
        .pipe(map(details => details ?
          // an observable of the IPendingRegistrationContext objects for this vote
          details.registration$$
            .scan((arr, voterReg$) => arr.concat(voterReg$), [])
            .switchMap(arr => arr.reduce(
              (combined$, voterReg$) => combined$.combineLatest(voterReg$,
                (combined, voterReg) => voterReg.status === RetrievalStatus.available && voterReg.value.blindSignature === null ?
                  combined.concat({
                    contract: details.address.value,
                    registrationAuthority: details.registrationAuthority.value,
                    registrationKey: details.key.value,
                    voter: voterReg.value.voter,
                    blindedAddress: voterReg.value.blindedAddress
                  }) :
                  combined
              ),
              Observable.of([])
            ))
            .startWith([]) :
          Observable.of([])
        ))
        // combine the pending registration contexts per vote into a single observable
        .pipe(scan(
          (allRegCtxs$, voteRegCtxs$) => allRegCtxs$.combineLatest(voteRegCtxs$,
            (allRegCtxs, voteRegCtxs) => allRegCtxs.concat(voteRegCtxs)
          ),
          Observable.of([])
        ))
        .pipe(switchAll())
    );
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
