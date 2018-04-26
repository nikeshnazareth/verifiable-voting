import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IVoteListingContractService, VoteListingContractService } from './vote-listing-contract.service';
import {
  ITruffleContractAbstraction, ITruffleContractService,
  TruffleContractService
} from '../truffle-contract.service';
import { IWeb3Provider, IWeb3Service, Web3Service } from '../web3.service';
import { ExpectedErrorWasNotThrown } from '../../../mocha.extensions';
import { IVoteListingContract } from './vote-listing.contract.interface';


describe('Service: VoteListingContractService', () => {
  // web3.sha3('DUMMY_PARAMS_HASH');
  const paramsHash: string = '0xe1affb9b7a982d2d184a5e6b9487744fa1937c1f10d958701615efcc4f4e0555';

  let voteListingContractSvc: IVoteListingContractService;
  let web3Svc: IWeb3Service;
  let contractSvc: ITruffleContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VoteListingContractService,
        {provide: Web3Service, useClass: MockWeb3Svc},
        {provide: TruffleContractService, useClass: MockTruffleContractSvc}
      ]
    });

    voteListingContractSvc = TestBed.get(VoteListingContractService);
    web3Svc = TestBed.get(Web3Service);
    contractSvc = TestBed.get(TruffleContractService);
  });

  describe('method: deployVote', () => {
    it('should fail if web3 is not injected', done => {
      spyOn(web3Svc, 'afterInjected').and.returnValue(Promise.reject('Not injected'));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc);
      voteListingContractSvc.deployVote(paramsHash)
        .then(() => {
          throw new ExpectedErrorWasNotThrown();
        })
        .catch(err => err instanceof ExpectedErrorWasNotThrown ? fail(err) : null)  // suppress the expected error
        .then(done);
    });

    it('should fail if contract.deploy fails', done => {
      spyOn(dummyContract, 'deploy').and.returnValue(Promise.reject('Deploy vote failed'));
      // recreate the service (the constructor in the original has already been called)
      voteListingContractSvc = new VoteListingContractService(<Web3Service> web3Svc, contractSvc);
      voteListingContractSvc.deployVote(paramsHash)
        .then(() => {
          throw new ExpectedErrorWasNotThrown();
        })
        .catch(err => err instanceof ExpectedErrorWasNotThrown ? fail(err) : null)  // suppress the expected error
        .then(done);
    });

    it('should return an empty promise', done => {
      voteListingContractSvc.deployVote(paramsHash)
        .then(result => expect(result).toBe(null))
        .then(done);
    });
  });


  class MockWeb3Svc implements IWeb3Service {
    public block$: EventEmitter<null> = null;
    public isInjected: boolean = true;
    public currentProvider: IWeb3Provider = null;
    public defaultAccount: string = null;

    afterInjected() {
      return Promise.resolve();
    }
  }

  const dummyContract: IVoteListingContract = {
    votingContracts: null,
    numberOfVotingContracts: null,
    deploy: (hash, options) => Promise.resolve({tx: 'A dummy transaction'})
  };

  class MockTruffleContractSvc implements ITruffleContractService {

    public abstraction: ITruffleContractAbstraction = {
      setProvider: (provider: IWeb3Provider) => null,
      deployed: () => dummyContract
    };

    wrap(definition: object) {
      return this.abstraction;
    }
  }
});

