import { Observable } from 'rxjs/Observable';

import { IVoteListingContractService } from '../../core/ethereum/vote-listing-contract/contract.service';
import { address, bytes32 } from '../../core/ethereum/type.mappings';
import { ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { IVoteManagerService, IVoteParameters } from '../../core/vote-manager/vote-manager.service';


export namespace Mock {

  export const DUMMY_ADDRESSES: address[] = [
    '_address1_',
    '_address2_',
    '_address3_',
    '_address4_',
  ];

  export class VoteListingContractService implements IVoteListingContractService {
    get deployedVotes$(): Observable<address> {
      return Observable.from(DUMMY_ADDRESSES);
    }

    deployVote$(paramsHash: bytes32): Observable<ITransactionReceipt> {
      return Observable.of(null);
    }
  }

  export class VoteManagerService implements IVoteManagerService {
    deployVote$(params: IVoteParameters): Observable<ITransactionReceipt> {
      return null;
    }

    getParameters$(addr: address): Observable<IVoteParameters> {
      return Observable.of({parameters: addr + '_params'});
    }
  }
}
