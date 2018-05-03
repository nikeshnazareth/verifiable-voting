import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export interface IErrorService {
  error$: Observable<Error>;

  add(err: Error): void;
}

/**
 * A service to aggregate errors that occur throughout the app
 */
export class ErrorService implements IErrorService {
  public error$: EventEmitter<Error>;

  constructor() {
    this.error$ = new EventEmitter<Error>();
  }

  /**
   * Emit the error on a global error stream
   * @param {Error} err the error to be emitted
   */
  public add(err: Error) {
    this.error$.emit(err);
  }
}
