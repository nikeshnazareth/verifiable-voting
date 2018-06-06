import { VoteListingAPI } from '../../core/ethereum/vote-listing-contract/contract.api';
import { ITransactionProperties, ITransactionReceipt } from '../../core/ethereum/transaction.interface';
import { IContractEventStream } from '../../core/ethereum/contract.interface';
import { Mock } from '../module';
import { address } from '../../core/ethereum/type.mappings';
import { BigNumber } from '../bignumber';

export class VoteListingContract implements VoteListingAPI {
  public votingContracts = {
    call: (index: number) => Promise.resolve(Mock.addresses[index])
  };

  public numberOfVotingContracts = {
    call: () => Promise.resolve(new BigNumber(Mock.addresses.length))
  };

  deploy(_registrationDeadline: number,
         _votingDeadline: number,
         _paramsHash: string,
         _eligibilityContract: address,
         _registrationAuthority: address,
         props: ITransactionProperties): Promise<ITransactionReceipt> {

    return Promise.resolve(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.params_hash === _paramsHash)[0]
        .deploy_receipt
    );
  }

  get address(): address {
    return Mock.VOTE_LISTING_ADDRESS;
  }

  allEvents(): IContractEventStream {
    return Mock.VoteCreatedEventStream;
  }
}

