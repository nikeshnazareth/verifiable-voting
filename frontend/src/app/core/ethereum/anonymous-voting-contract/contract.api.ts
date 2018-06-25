import { IContractLog } from '../contract.interface';
import { ITransactionProperties, ITransactionReceipt } from '../transaction.interface';
import { address, uint } from '../type.mappings';
import { VotePhasesAPI } from './vote-phases-contract.api';

export interface AnonymousVotingAPI extends VotePhasesAPI {
  // string public parametersHash;
  parametersHash: {
    call(): Promise<string>;
  };
  // Gatekeeper public eligibilityContract;
  eligibilityContract: {
    call(): Promise<address>;
  };
  // address public registrationAuthority;
  registrationAuthority: {
    call(): Promise<address>;
  };
  // uint public pendingRegistrations;
  pendingRegistrations: {
    call(): Promise<uint>;
  };
  /*
    mapping(address => BlindedAddress) public blindedAddress;
    struct BlindedAddress {
      string addressHash;
      signatureHash;
    }
  */
  blindedAddress: {
    call(addr: address): Promise<string[]>
  };
  // mapping(address => string) public voteHashes;
  voteHashes: {
    call(addr: address): Promise<string>;
  };
  // function register(string _blindedAddressHash) public
  register(_blindedAddressHash: string, props?: ITransactionProperties): Promise<ITransactionReceipt>;

  // function vote(string _voteHash) public
  vote(_voteHash: string, props?: ITransactionProperties): Promise<ITransactionReceipt>;
}

export namespace VoterInitiatedRegistration {
  export const name: string = 'VoterInitiatedRegistration';

  export interface Log extends IContractLog {
    args: {
      voter: address;
      blindedAddressHash: string;
    };
  }
}

export namespace RegistrationComplete {
  export const name: string = 'RegistrationComplete';

  export interface Log extends IContractLog {
    args: {
      voter: address;
      signatureHash: string;
    };
  }
}

export namespace VoteSubmitted {
  export const name: string = 'VoteSubmitted';

  export interface Log extends IContractLog {
    args: {
      voter: address;
      voteHash: string;
    };
  }
}



