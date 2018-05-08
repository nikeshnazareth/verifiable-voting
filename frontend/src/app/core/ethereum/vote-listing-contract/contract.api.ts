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

  // function deploy(uint _registrationDeadline, uint _votingDeadline, string _paramsHash) external
  deploy(_registrationDeadline: uint, _votingDeadline: uint, _paramsHash: string,
         props: ITransactionProperties): Promise<ITransactionReceipt>;
}

export namespace VoteCreatedEvent {
  export const name: string = 'VoteCreated';

  export interface Log extends IContractLog {
    args: {
      contractAddress: address;
    };
  }
}

