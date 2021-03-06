import { IContract } from '../contract.interface';
import { ITransactionProperties, ITransactionReceipt } from '../transaction.interface';
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

  /*
    function deploy(
      uint _registrationDeadline,
      uint _votingDeadline,
      string _paramsHash,
      address _eligibilityContract,
      address _registrationAuthority
    )
  */
  deploy(_registrationDeadline: number,
         _votingDeadline: number,
         _paramsHash: string,
         _elibigilityContract: address,
         _registrationAuthority: address,
         props: ITransactionProperties): Promise<ITransactionReceipt>;
}

