import { VoteListingAPI } from '../core/ethereum/vote-listing-contract/contract.api';
import { ITransactionProperties, ITransactionReceipt } from '../core/ethereum/transaction.interface';
import { IContractEventStream } from '../core/ethereum/contract.interface';
import { Mock } from './module';
import { uint } from '../core/ethereum/type.mappings';
import * as BigNumber from 'bignumber.js';

export class VoteListingContract implements VoteListingAPI {
  public votingContracts = {
    call: (index: number) => Promise.resolve(Mock.AnonymousVotingContractCollections[index].address)
  };

  public numberOfVotingContracts = {
    call: () => Promise.resolve(new BigNumber(Mock.AnonymousVotingContractCollections.length))
  };

  deploy(_registrationExpiration: uint,
         _votingExpiration: uint,
         _paramsHash: string, props: ITransactionProperties): Promise<ITransactionReceipt> {

    return Promise.resolve(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.timeframes.registrationDeadline === _registrationExpiration)
        .filter(collection => collection.timeframes.votingDeadline === _votingExpiration)
        .filter(collection => collection.params_hash === _paramsHash)[0]
        .deploy_receipt
    );
  }

  allEvents(): IContractEventStream {
    return Mock.VoteCreatedEventStream;
  }
}

