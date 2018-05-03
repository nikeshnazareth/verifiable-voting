import { ITransactionProperties, ITransactionReceipt } from '../transaction.interface';
import { IContract, IContractLog } from '../contract.interface';
import { address, uint } from '../type.mappings';

export interface VoteListingAPI extends IContract {
  // address[] public votingContracts
  votingContracts: {
    call(index: number): Promise<address>;
  };
   // function numberOfVotingContracts() public constant returns (uint)
  numberOfVotingContracts: {
    call(): Promise<uint>;
  };
  // function deploy(string _paramsHash) public
  deploy(_paramsHash: string, props: ITransactionProperties): Promise<ITransactionReceipt>;
}

export namespace VoteCreatedEvent {
  export const name: string = 'VoteCreated';
  export interface Log extends IContractLog {
    args: {
      contractAddress: address;
    };
  }
}

