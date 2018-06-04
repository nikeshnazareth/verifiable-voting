import { Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { IVotingContractDetails } from '../../core/vote-retrieval/vote-retreival.service.constants';
import { VoteRetrievalService } from '../../core/vote-retrieval/vote-retrieval.service';

export abstract class AbstractPhaseComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  protected submission$: Subject<any>;
  protected ready$: Observable<boolean>;
  protected voteDetails: Observable<IVotingContractDetails>;

  protected message$: Observable<string>;
  private _index$: BehaviorSubject<number>;
  private _subscription: Subscription;

  constructor(private voteRetrievalSvc: VoteRetrievalService) {
    this._index$ = new BehaviorSubject<number>(null);
    this.submission$ = new Subject<any>();
  }

  /**
   * Initialises the observables used by the view
   */
  ngOnInit() {
    this.voteDetails = this._index$
      .switchMap(idx => this.voteRetrievalSvc.detailsAtIndex$(idx))
      .shareReplay(1);

    this.message$ = this.voteDetails.map(details => this.statusMessage(details));
    this.ready$ = this.message$.map(msg => msg === null);
    this.createForm();
    this._subscription = this.handleSubmissions().subscribe();
  }

  /**
   * Close the subscription when the component is destroyed
   */
  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  /**
   * Convert the input "index" into an observable
   * @param val
   */
  @Input()
  set index(val: number) {
    this._index$.next(val);
  }

  abstract createForm(): void;

  abstract handleSubmissions(): Observable<any>;

  abstract statusMessage(voteDetails: IVotingContractDetails): string;
}
