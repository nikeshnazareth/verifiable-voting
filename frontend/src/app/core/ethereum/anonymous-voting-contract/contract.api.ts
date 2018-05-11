import { IContract } from '../contract.interface';
import { address, uint } from '../type.mappings';

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
}

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

