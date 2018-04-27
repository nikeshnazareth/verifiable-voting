import { ITransactionProperties, ITransactionReceipt } from '../transaction.interface';
import { IContract, IContractLog } from '../contract.interface';

export interface VoteListingAPI extends IContract {
  // address[] public votingContracts
  votingContracts: {
    call(index: number): Promise<string>;
  };
   // function numberOfVotingContracts() public constant returns (uint)
  numberOfVotingContracts: {
    call(): Promise<number>;
  };
  // function deploy(bytes32 _paramsHash) public
  deploy(_paramsHash: string, props: ITransactionProperties): Promise<ITransactionReceipt>;
}

export namespace VoteCreatedEvent {
  export const name = 'VoteCreated';
  export interface Log extends IContractLog {
    args: {
      contractAddress: string;
    };
  }
}

