import { IContract, IContractLog } from '../contract.interface';
import { address, uint } from '../type.mappings';
import * as BigNumber from 'bignumber.js';
import { ITransactionReceipt } from "../transaction.interface";


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

  // function register(string _blindedAddressHash) public
  register(_blindedAddressHash: string): Promise<ITransactionReceipt>;
}

export namespace NewPhaseEvent {
  export const name: string = 'NewPhase';

  export interface Log extends IContractLog {
    args: {
      phase: BigNumber;
    };
  }
}

export namespace VoterInitiatedRegistration {
  export const name: string = 'VoterInitiatedRegistration';

  export interface Log extends IContractLog {
    args: {
      voter: address;
    };
  }
}

export const VotePhases = [
  'REGISTRATION',
  'VOTING',
  'COMPLETE'
];

interface VotePhasesAPI extends IContract {
  // Phase public currentPhase;
  currentPhase: {
    call(): Promise<uint>;
  };

  // uint public registrationDeadline;
  registrationDeadline: {
    call(): Promise<uint>;
  };

  // uint public votingDeadline;
  votingDeadline: {
    call(): Promise<uint>;
  };
}
