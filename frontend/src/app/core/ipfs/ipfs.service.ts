
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../environments/environment';
import { IPFSService as DevelopmentSvc } from './local-ipfs.service';
import { IPFSService as ProductionSvc} from './production-ipfs.service';


export interface IIPFSService {
  addJSON(data: object): Observable<string>;

  catJSON(hash: string): Observable<object>;
}

/**
 * This is a pass-through service that users the local or production IPFS service
 * depending on the environment.
 * I have not been able to make Angular's Dependency Injection mechanism choose
 * the service based on a value in the environment object, so instead, it will
 * always use this service, which performs the selection manually.
 */
@Injectable()
export class IPFSService implements IIPFSService {
  private svc: IIPFSService;

  constructor() {
    this.svc = environment.production ? new ProductionSvc() : new DevelopmentSvc();
  }

  addJSON(data: object): Observable<string> {
    return this.svc.addJSON(data);
  }

  catJSON(hash: string): Observable<object> {
    return this.svc.catJSON(hash);
  }
}

