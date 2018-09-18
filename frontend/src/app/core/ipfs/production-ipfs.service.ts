import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { APP_CONFIG, HttpEndpoint } from '../../config';
import { IIPFSService } from './ipfs.service';

@Injectable()
export class IPFSService implements IIPFSService {
  private getCfg: HttpEndpoint;
  private postCfg: HttpEndpoint;

  /**
   * Configure the service to use the IPFS node defined in APP_CONFIG
   */
  constructor(private http: HttpClient) {
    this.getCfg = APP_CONFIG.ipfs.get;
    this.postCfg = APP_CONFIG.ipfs.post;
  }

  /**
   * Adds the data to this._node
   * @param data any json object to be published to IPFS
   * @returns {Observable<string>} the IPFS address (hash) of the data
   */
  addJSON(data: object): Observable<string> {
    return this.http.post(this.url(this.postCfg), data, this.postCfg.headers ? {headers: this.postCfg.headers} : null)
      .map(response => <string> response['data']);
  }

  /**
   * Retrieves the data at the given IPFS address from this._node
   * @param hash the hash address of the data to be retrieved
   * @returns {Observable<object>} the json data stored at the given hash
   */
  catJSON(hash: string): Observable<object> {
    return this.http.get(`${this.url(this.getCfg)}/${hash}`);
  }

  private url(cfg: HttpEndpoint) {
    return `${cfg.protocol}://${cfg.host}${cfg.port ? `:${cfg.port}` : ''}/${cfg.endpoint}`;
  }

}

