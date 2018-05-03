/**
 * This is a local IPFS service to be used during development
 * (so we don't poll ipfs.infuro.io every time the app is reloaded)
 */

import { Injectable } from '@angular/core';
import { IIPFSService } from './ipfs.service';

@Injectable()
export class IPFSService implements IIPFSService {
  private HASH_SPACE_SIZE: number = 10 ** 6;

  addJSON(data: object): Promise<string> {
    const hash: string = String(Math.random() * this.HASH_SPACE_SIZE);
    localStorage.setItem(hash, JSON.stringify(data));
    return Promise.resolve(hash);
  }

  catJSON(hash: string): Promise<object> {
    try {
      const data: object = JSON.parse(localStorage.getItem(hash));
      return Promise.resolve(data);
    } catch {
      return Promise.reject(`Hash ${hash} does not exist at this node`);
    }
  }
}
