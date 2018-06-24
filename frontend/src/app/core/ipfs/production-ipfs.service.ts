import { Injectable } from '@angular/core';
import * as IPFS from 'ipfs-mini';
import { APP_CONFIG } from '../../config';
import { IIPFSService } from './ipfs.service';

@Injectable()
export class IPFSService implements IIPFSService {
  private _node: IIPFSNode;

  /**
   * Configure the service to use the IPFS node defined in APP_CONFIG
   */
  constructor() {
    this._node = new IPFS(APP_CONFIG.ipfs);
  }

  /**
   * Adds the data to this._node
   * @param data any json object to be published to IPFS
   * @returns {Promise<string>} the IPFS address (hash) of the data
   */
  addJSON(data: object): Promise<string> {
    return new Promise((resolve, reject) => {
      this._node.addJSON(data, (error, hash) => error ? reject(error) : resolve(hash));
    });
  }

  /**
   * Retrieves the data at the given IPFS address from this._node
   * @param hash the hash address of the data to be retrieved
   * @returns {Promise<object>} the json data stored at the given hash
   */
  catJSON(hash: string): Promise<object> {
    return new Promise((resolve, reject) => {
      this._node.catJSON(hash, (error, data) => error ? reject(error) : resolve(data));
    });
  }

}


interface IIPFSNode {
  add(data: string, cb: (error: string, hash: string) => void);

  cat(hash: string, cb: (error: string, data: string) => void);

  addJSON(data: object, cb: (error: string, hash: string) => void);

  catJSON(hash: string, cb: (error: string, data: object) => void);
}
