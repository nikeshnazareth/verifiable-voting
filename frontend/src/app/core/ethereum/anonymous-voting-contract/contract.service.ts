import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/defaultIfEmpty';

import { APP_CONFIG } from '../../../config';
import { Web3Service } from '../web3.service';
import { ITruffleContractAbstraction, TruffleContractWrapperService } from '../truffle-contract-wrapper.service';
import { ErrorService } from '../../error-service/error.service';
import { address } from '../type.mappings';
import {
  AnonymousVotingAPI, NewPhaseEvent, RegistrationComplete, VotePhases,
  VoterInitiatedRegistration, VoteSubmitted
} from './contract.api';
import { IContractLog } from '../contract.interface';
import { ITransactionReceipt } from '../transaction.interface';


export interface IAnonymousVotingContractService {
  phaseAt$(addr: address): Observable<number>;

  paramsHashAt$(addr: address): Observable<string>;

  registrationDeadlineAt$(addr: address): Observable<Date>;

  votingDeadlineAt$(addr: address): Observable<Date>;

  pendingRegistrationsAt$(addr: address): Observable<number>;

  blindSignatureHashAt$(contractAddr: address, publicVoterAddr: address): Observable<string>;

  voteHashesAt$(addr: address): Observable<string>;

  registerAt$(contractAddr: address, voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt>;

  voteAt$(contractAddr: address, anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt>;
}

export const AnonymousVotingContractErrors = {
  network: (addr) => new Error(`Unable to find the AnonymousVoting contract on the blockchain at address ${addr}. ` +
    'Ensure the address is correct ' +
    `and MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`),
  events: (addr) => new Error(`Unexpected error in the event stream of the AnonymousVoting contract at ${addr}`),
  paramsHash: (addr) => new Error(`Unable to retrieve the parameters hash from the AnonymousVoting contract at ${addr}`),
  phase: (addr) => new Error(`Unable to retrieve the current phase from the AnonymousVoting contract at ${addr}`),
  regDeadline: (addr) => new Error('Unable to retrieve the registration deadline from the AnonymousVoting contract' +
    `at ${addr}`),
  votingDeadline: (addr) => new Error('Unable to retrieve the voting deadline from the AnonymousVoting contract' +
    `at ${addr}`),
  pendingRegistration: (addr) => new Error('Unable to retrieve the pending registrations from the ' +
    `AnonymousVoting contract at ${addr}`),
  blindSignature: (contract, voterAddr) => new Error('Unable to retrieve the blind signature hash ' +
    `for the voter ${voterAddr} from the AnonymousVoting contract ${contract}`),
  voteHashes: (addr) => new Error(`Unable to retrieve the vote hashes from the AnonymousVoting contract at ${addr}`),
  registration: (contractAddr, voter) => new Error(`Unable to register voter ${voter} ` +
    `at the AnonymousVoting contract ${contractAddr}`),
  vote: (contractAddr, voter) => new Error(`Unable to vote on from ${voter} ` +
    `at the AnonymousVoting contract ${contractAddr}`)
};

@Injectable()
export class AnonymousVotingContractService implements IAnonymousVotingContractService {
  private _abstraction$: Observable<ITruffleContractAbstraction>;

  constructor(private web3Svc: Web3Service,
              private contractSvc: TruffleContractWrapperService,
              private errSvc: ErrorService) {

    this._abstraction$ = this._initContractAbstraction();
  }

  /**
   * Creates an observable of phase changes on the specified AnonymousVoting contract
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<number>} the stream of phases starting at the current phase <br/>
   * or an empty observable if there is an error
   */
  phaseAt$(addr: address): Observable<number> {
    return this._contractAt(addr)
      .defaultIfEmpty(null) // cause an error
      .map(contract => contract.currentPhase.call())
      .switchMap(phasePromise => Observable.fromPromise(phasePromise))
      .map(phaseBN => phaseBN.toNumber())
      .do(null, err => this.errSvc.add(AnonymousVotingContractErrors.phase(addr), err))
      .concat(this._eventsAt$(addr)
        .filter(log => log.event === NewPhaseEvent.name)
        .map(log => (<NewPhaseEvent.Log> log).args.phase.toNumber())
      )
      // complete the observable when the final phase is reached
      .takeWhile(phase => phase < VotePhases.length - 1)
      // but still emit the final phase
      .concat(Observable.of(VotePhases.length - 1))
      .catch(err => <Observable<number>> Observable.empty())
      .share();
  }

  /**
   * Queries the parameters hash from the specified AnonymousVoting contract.
   * Notifies the Error Service if there is no contract at the specified address
   * or if the hash cannot be retrieved
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<string>} an observable that emits the parameters hash<br/>
   * or an empty observable if there was an error
   */
  paramsHashAt$(addr: address): Observable<string> {
    return this._contractAt(addr)
      .map(contract => contract.parametersHash.call())
      .switchMap(hashPromise => Observable.fromPromise(hashPromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.paramsHash(addr), err);
        return <Observable<string>> Observable.empty();
      });
  }

  /**
   * Queries the registration deadline from the specified AnonymousVoting contract
   * Notifies the Error Service if there is no contract at the specified address
   * or if the deadline cannot be retrieved
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<Date>} an observable that emits the registration deadline <br/>
   * or an empty observable if there was an error
   */
  registrationDeadlineAt$(addr: address): Observable<Date> {
    return this._contractAt(addr)
      .map(contract => contract.registrationDeadline.call())
      .switchMap(deadlinePromise => Observable.fromPromise(deadlinePromise))
      .map(deadlineBN => deadlineBN.toNumber())
      .map(deadlineInt => new Date(deadlineInt))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.regDeadline(addr), err);
        return <Observable<Date>> Observable.empty();
      });
  }

  /**
   * Queries the voting deadline from the specified AnonymousVoting contract
   * Notifies the Error Service if there is no contract at the specified address
   * or if the deadline cannot be retrieved
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<Date>} an observable that emits the voting deadline <br/>
   * or an empty observable if there was an error
   */
  votingDeadlineAt$(addr: address): Observable<Date> {
    return this._contractAt(addr)
      .map(contract => contract.votingDeadline.call())
      .switchMap(deadlinePromise => Observable.fromPromise(deadlinePromise))
      .map(deadlineBN => deadlineBN.toNumber())
      .map(deadlineInt => new Date(deadlineInt))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.votingDeadline(addr), err);
        return <Observable<Date>> Observable.empty();
      });
  }

  /**
   * Queries the number of pending registrations from the specified AnonymousVoting contract whenever
   * a VoterInitiatedRegistration or RegistrationComplete event occurs on the contract
   * Notifies the Error Service if there is no contract at the specified address or if the pending registrations
   * cannot be retrieved
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<number>} an observable the emits the pending registrations whenever it changes and
   * closes if there is an error
   */
  pendingRegistrationsAt$(addr: address): Observable<number> {
    return this._eventsAt$(addr)
      .filter(log => [VoterInitiatedRegistration.name, RegistrationComplete.name].includes(log.event))
      .startWith(null)
      .switchMap(() => this._contractAt(addr))
      .map(contract => contract.pendingRegistrations.call())
      .switchMap(pendingRegPromise => Observable.fromPromise(pendingRegPromise))
      .map(pendingRegistration => pendingRegistration.toNumber())
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.pendingRegistration(addr), err);
        return <Observable<number>> Observable.empty();
      });
  }

  /**
   * Queries the signed blinded address hash of the specified voter from the specified AnonymousVoting contract
   * Notifies the Error Service if there is no contract at the specified address or if the blind signature hash
   * cannot be retrieved
   * @param {address} contractAddr the address of the AnonymousVoting contract
   * @param {address} publicVoterAddr the public address of the voter
   * @returns {Observable<string>} an observable that emits the blind signature <br/>
   * or an empty Observable if there was an error
   */
  blindSignatureHashAt$(contractAddr: address, publicVoterAddr: address): Observable<string> {
    const SIG_HASH_IDX: number = 1;
    return this._contractAt(contractAddr)
      .map(contract => contract.blindedAddress.call(publicVoterAddr))
      .switchMap(blindSigPromise => Observable.fromPromise(blindSigPromise))
      .map(blindSignature => blindSignature[SIG_HASH_IDX])
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.blindSignature(contractAddr, publicVoterAddr), err);
        return <Observable<string>> Observable.empty();
      });
  }

  /**
   * Queries the vote hash whenever a VoteSubmitted event occurs
   * Notifies the error service if there is no contract at the specified address or if a vote hash cannot be retrieved
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<string>} an observable that emits vote hashes as they are published<br/>
   * and closes if there is an error
   */
  voteHashesAt$(addr: address): Observable<string> {
    return this._eventsAt$(addr)
      .filter(log => log.event === VoteSubmitted.name)
      .map(log => <VoteSubmitted.Log> log)
      .switchMap(log =>
        this._contractAt(addr)
          .map(contract => contract.voteHashes.call(log.args.voter))
      )
      .switchMap(voteHashPromise => Observable.fromPromise(voteHashPromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.voteHashes(addr), err);
        return <Observable<string>> Observable.empty();
      });
  }

  /**
   * Uses the specified AnonymousVoting contract to register the specified voter's blinded address hash
   * @param {address} contractAddr the address of the AnonymousVoting contract
   * @param {address} voterAddr the public address of the voter
   * @param {string} blindAddressHash the IPFS hash of the voter's blinded anonymous address
   * @returns {Observable<ITransactionReceipt>} an observable that emits the receipt when the voter's registration<br/>
   * request is published or an empty observable if there was an error
   */
  registerAt$(contractAddr: address, voterAddr: address, blindAddressHash: string): Observable<ITransactionReceipt> {
    return this._contractAt(contractAddr)
      .map(contract => contract.register(blindAddressHash, {from: voterAddr}))
      .switchMap(registerPromise => Observable.fromPromise(registerPromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.registration(contractAddr, voterAddr), err);
        return <Observable<ITransactionReceipt>> Observable.empty();
      });
  }

  /**
   * Uses the specified AnonymousVoting contract to vote from the specified address
   * @param {address} contractAddr the address of the AnonymousVoting contract
   * @param {address} anonymousAddr the anonymous address of the voter
   * @param {string} voteHash the IPFS hash of the voter's vote and proof of registration
   * @returns {Observable<ITransactionReceipt>} an observable that emits the receipt when the vote is cast<br/>
   * or an empty observable if there was an error
   */
  voteAt$(contractAddr: address, anonymousAddr: address, voteHash: string): Observable<ITransactionReceipt> {
    return this._contractAt(contractAddr)
      .map(contract => contract.vote(voteHash, {from: anonymousAddr}))
      .switchMap(votePromise => Observable.fromPromise(votePromise))
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.vote(contractAddr, anonymousAddr), err);
        return <Observable<ITransactionReceipt>> Observable.empty();
      });
  }

  /**
   * Creates an observable of events on the specified AnonymousVoting contract
   * Notifies the Error Service if there is no contract at the specified address
   * or if the contract event stream contains errors
   * @param {address} addr the address of the AnonymousVoting contract
   * @returns {Observable<IContractLog>} the stream of contract events<br/>
   * or an empty observable if there was an error
   */
  private _eventsAt$(addr: address): Observable<IContractLog> {
    return this._contractAt(addr)
      .map(contract => contract.allEvents({fromBlock: 0, toBlock: 'latest'}))
      .switchMap(events => <Observable<IContractLog>> Observable.create(observer => {
        events.watch((err, log) => err ?
          this.errSvc.add(AnonymousVotingContractErrors.events(addr), err) :
          observer.next(log)
        );
        return () => events.stopWatching();
      }))
      .share();
  }

  /**
   * Finds the AnonymousVoting contract and returns an AnonymousVotingContract object to interact with it
   * It notifies the Error Service if there is no AnonymousVoting contract at the specified address
   * @param {address} addr the address of the contract
   * @returns {Observable<AnonymousVotingContract>} An observable of the contract object<br/>
   * or the equivalent of Observable.empty() if the contract cannot be found
   */
  private _contractAt(addr: address): Observable<AnonymousVotingAPI> {
    return this._abstraction$
      .map(abstraction => abstraction.at(addr))
      .switchMap(contractPromise => Observable.fromPromise(contractPromise))
      .map(contract => <AnonymousVotingAPI> contract)
      .catch(err => {
        this.errSvc.add(AnonymousVotingContractErrors.network(addr), err);
        return <Observable<AnonymousVotingAPI>> Observable.empty();
      });
  }

  /**
   * Uses the truffle build object to create a truffle abstraction of the AnonymousVoting contract
   * It notifies the Error Service if web3 is not injected
   * @returns {Observable<ITruffleContractAbstraction>} (an Observable of) the truffle abstraction</br>
   * of the AnonymousVoting contract or Observable.empty() if web3 is not injected
   * @private
   */
  private _initContractAbstraction(): Observable<ITruffleContractAbstraction> {
    if (this.web3Svc.currentProvider) {
      const abstraction: ITruffleContractAbstraction = this.contractSvc.wrap(APP_CONFIG.contracts.anonymous_voting);
      abstraction.setProvider(this.web3Svc.currentProvider);
      return Observable.of(abstraction);
    } else {
      this.errSvc.add(APP_CONFIG.errors.web3, null);
      return Observable.empty();
    }
  }
}

