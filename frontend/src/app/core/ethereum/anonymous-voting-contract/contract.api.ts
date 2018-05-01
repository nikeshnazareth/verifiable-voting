
import { IContract } from '../contract.interface';
import { bytes32 } from '../type.mappings';

export interface AnonymousVotingAPI extends IContract {
  // bytes32 public parametersHash;
  parametersHash: {
    call(): Promise<bytes32>;
  };
}
