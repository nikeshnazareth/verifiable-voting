import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export interface IErrorPair {
  friendly: Error;
  detailed: Error;
}

export interface IErrorService {
  error$: Observable<IErrorPair>;

  add(friendlyErr: Error, detailedErr: Error): void;
}

/**
 * A service to aggregate errors that occur throughout the app
 */
@Injectable()
export class ErrorService implements IErrorService {
  public error$: EventEmitter<IErrorPair>;

  constructor() {
    this.error$ = new EventEmitter<IErrorPair>();
  }

  /**
   * Emit the error on a global error stream
   * @param {Error} friendlyErr A simple Error message that can be shown to the user
   * @param {Error} detailedErr The original error message to help with debugging
   */
  public add(friendlyErr: Error, detailedErr: Error) {
    this.error$.emit({
      friendly: friendlyErr,
      detailed: detailedErr
    });
  }
}
