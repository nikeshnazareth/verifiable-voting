import { IContract } from '../contract.interface';
import { uint } from '../type.mappings';

export interface AnonymousVotingAPI extends VotePhasesAPI {
  // string public parametersHash;
  parametersHash: {
    call(): Promise<string>;
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

