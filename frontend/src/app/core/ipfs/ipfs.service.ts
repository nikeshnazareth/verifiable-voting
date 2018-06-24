
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IPFSService as DevelopmentSvc } from './local-ipfs.service';
import { IPFSService as ProductionSvc} from './production-ipfs.service';


export interface IIPFSService {
  addJSON(data: object): Promise<string>;

  catJSON(hash: string): Promise<object>;
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

  addJSON(data: object): Promise<string> {
    return this.svc.addJSON(data);
  }

  catJSON(hash: string): Promise<object> {
    return this.svc.catJSON(hash);
  }
}

