import { EventEmitter } from '@angular/core';

import { IWeb3Provider, IWeb3Service } from '../web3.service';
import { IContractEventStream } from '../contract.interfaces';
import { IVoteListingContract } from './vote-listing.contract.interface';
import { ITruffleContractAbstraction, ITruffleContractService } from '../truffle-contract.service';

export class MockWeb3Svc implements IWeb3Service {
  public block$: EventEmitter<null> = null;
  public isInjected: boolean = true;
  public currentProvider: IWeb3Provider = null;
  public defaultAccount: string = null;

  afterInjected() {
    return Promise.resolve();
  }
}

export class MockTruffleContractSvc implements ITruffleContractService {
  wrap(definition: object) {
    return new DummyAbstraction();
  }
}

export interface IDummyAbstraction extends ITruffleContractAbstraction {
  contract: IDummyContract;
}

export class DummyAbstraction implements IDummyAbstraction {
  contract = new DummyContract();

  setProvider(provider) {
  }

  deployed() {
    return Promise.resolve(this.contract);
  }
}


interface IDummyContract extends IVoteListingContract {
  eventStream: IDummyEventStream;
}

class DummyContract implements IDummyContract {
  eventStream = new DummyEventStream();
  votingContracts;
  numberOfVotingContracts;

  deploy(hash, options) {
    return Promise.resolve({tx: 'A dummy transaction'});
  }

  allEvents() {
    return this.eventStream;
  }
}


interface IDummyEventStream extends IContractEventStream {
  trigger(err, log): void;
}

class DummyEventStream implements IDummyEventStream {
  private callback;

  trigger(err, log) {
    this.callback(err, log);
  }

  watch(cb) {
    this.callback = cb;
  }
}




