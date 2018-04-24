import { ITransactionProperties, ITransactionReceipt } from './transaction.interface';

export interface IVoteListingContract {
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
