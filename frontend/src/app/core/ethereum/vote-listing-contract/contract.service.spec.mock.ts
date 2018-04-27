import { EventEmitter } from '@angular/core';

import { IWeb3Provider, IWeb3Service } from '../web3.service';
import { IContractEventStream as IProdContractEventStream } from '../contract.interface';
import { VoteListingAPI as IProdVoteListingContract } from './contract.api';
import {
  ITruffleContractAbstraction as IProdTruffleContractAbstraction,
  ITruffleContractWrapperService
} from '../truffle-contract.service';

export namespace Mock {
  export class Web3Service implements IWeb3Service {
    public block$: EventEmitter<null> = null;
    public isInjected: boolean = true;
    public currentProvider: IWeb3Provider = null;
    public defaultAccount: string = null;

    afterInjected() {
      return Promise.resolve();
    }
  }

  // The following classes provide a mechanism for tests to
  // directly manipulate the VoteListing contract event stream

  export class TruffleContractWrapperService implements ITruffleContractWrapperService {
    wrap(definition: object) {
      return new TruffleContractAbstraction();
    }
  }

  export interface ITruffleContractAbstraction extends IProdTruffleContractAbstraction {
    contract: IVoteListingContract;
  }

  export class TruffleContractAbstraction implements ITruffleContractAbstraction {
    contract = new VoteListingContract();

    setProvider(provider) {
    }

    deployed() {
      return Promise.resolve(this.contract);
    }
  }

  interface IVoteListingContract extends IProdVoteListingContract {
    eventStream: IContractEventStream;
  }

  class VoteListingContract implements IVoteListingContract {
    eventStream = new ContractEventStream();
    votingContracts;
    numberOfVotingContracts;

    deploy(hash, options) {
      return Promise.resolve({tx: 'A dummy transaction'});
    }

    allEvents() {
      return this.eventStream;
    }
  }


  interface IContractEventStream extends IProdContractEventStream {
    trigger(err, log): void;
  }

  class ContractEventStream implements IContractEventStream {
    private callback;

    trigger(err, log) {
      this.callback(err, log);
    }

    watch(cb) {
      this.callback = cb;
    }
  }
}












