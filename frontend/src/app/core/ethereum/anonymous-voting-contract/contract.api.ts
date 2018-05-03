
import { IContract } from '../contract.interface';

export interface AnonymousVotingAPI extends IContract {
  // string public parametersHash;
  parametersHash: {
    call(): Promise<string>;
  };
}


