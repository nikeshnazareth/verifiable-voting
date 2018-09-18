/**
 * This is a local IPFS service to be used during development
 * (so we don't poll the external gateway every time the app is reloaded)
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { IIPFSService } from './ipfs.service';

@Injectable()
export class IPFSService implements IIPFSService {
  private hashSpaceSize: number = 10 ** 6;

  addJSON(data: object): Observable<string> {
    const hash: string = String(Math.floor(Math.random() * this.hashSpaceSize));
    localStorage.setItem(hash, JSON.stringify(data));
    return Observable.of(hash);
  }

  catJSON(hash: string): Observable<object> {
    try {
      const data: object = JSON.parse(localStorage.getItem(hash));
      return Observable.of(data);
    } catch {
      return Observable.throwError(new Error(`Hash ${hash} does not exist at this node`));
    }
  }
}
