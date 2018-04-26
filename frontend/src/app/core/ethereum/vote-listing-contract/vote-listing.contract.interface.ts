import { ITransactionProperties, ITransactionReceipt } from '../transaction.interface';
import { IContract, IContractLog } from '../contract.interfaces';

export interface IVoteListingContract extends IContract {
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

export namespace VoteCreated {
  export const event = 'VoteCreated';
  export interface Log extends IContractLog {
    args: {
      contractAddress: string;
    };
  }
}

