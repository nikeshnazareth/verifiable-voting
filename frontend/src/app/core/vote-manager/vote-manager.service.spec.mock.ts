import { Observable } from 'rxjs/Observable';

import { IAnonymousVotingContractService } from '../ethereum/anonymous-voting-contract/contract.service';
import { address } from '../ethereum/type.mappings';
import { AnonymousVotingAPI } from '../ethereum/anonymous-voting-contract/contract.api';
import { IIPFSService } from '../ipfs/ipfs.service';
import { IVoteParameters } from './vote-manager.service';
import { IVoteListingContractService } from '../ethereum/vote-listing-contract/contract.service';
import { ITransactionReceipt } from '../ethereum/transaction.interface';

// These classes simulate the ideal scenario
// Error cases must be tested by overriding the functionality

class AnonymousVotingContract implements AnonymousVotingAPI {
  parametersHash = {
    call: () => Promise.resolve(Mock.DUMMY_HASH)
  };

  allEvents() {
    return null;
  }
}

export namespace Mock {
  export const ANONYMOUS_VOTING_CONTRACT: AnonymousVotingAPI = new AnonymousVotingContract();
  export const DUMMY_HASH: string = 'DUMMY_HASH';
  export const DUMMY_VOTE_PARAMETERS: IVoteParameters = {parameters: 'DUMMY_PARAMETERS'};
  export const DUMMY_TX_RECEIPT: ITransactionReceipt = {tx: 'A dummy receipt'};

  export class AnonymousVotingContractService implements IAnonymousVotingContractService {
    contractAt(addr: address) {
      return Observable.of(ANONYMOUS_VOTING_CONTRACT);
    }
  }

  export class IPFSService implements IIPFSService {
    addJSON(data: object): Promise<string> {
      return Promise.resolve(DUMMY_HASH);
    }

    catJSON(hash: string): Promise<object> {
      return Promise.resolve(DUMMY_VOTE_PARAMETERS);
    }
  }

  export class VoteListingContractService implements IVoteListingContractService {
    deployedVotes$: Observable<address>;

    deployVote$(paramsHash: string): Observable<ITransactionReceipt> {
      return Observable.of(DUMMY_TX_RECEIPT);
    };
  }
}

