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

  // uint public registrationExpiration;
  registrationExpiration: {
    call(): Promise<uint>;
  };

  // uint public votingExpiration;
  votingExpiration: {
    call(): Promise<uint>;
  };
}

