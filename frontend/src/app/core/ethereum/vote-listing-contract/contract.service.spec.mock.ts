import { EventEmitter } from '@angular/core';

import { IWeb3Provider, IWeb3Service } from '../web3.service';
import { IContractEventStream as IProdContractEventStream } from '../contract.interface';
import { VoteListingAPI as IProdVoteListingContract } from './contract.api';
import {
  ITruffleContractAbstraction as IProdTruffleContractAbstraction,
  ITruffleContractWrapperService
} from '../truffle-contract.service';
import { address } from '../type.mappings';
import * as BigNumber from 'bignumber.js';

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

    setContractAddresses(contracts: address[]);
  }

  class VoteListingContract implements IVoteListingContract {
    private contracts: address[] = [];
    eventStream = new ContractEventStream();
    votingContracts = {
      call: (idx: number) => Promise.resolve(this.contracts[idx])
    };
    numberOfVotingContracts = {
      call: () => new BigNumber(this.contracts.length)
    };

    deploy(hash, options) {
      return Promise.resolve({tx: 'A dummy transaction'});
    }

    allEvents() {
      return this.eventStream;
    }

    setContractAddresses(contracts) {
      this.contracts = contracts;
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












