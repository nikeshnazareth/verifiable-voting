import { IContractLog } from '../contract.interface';
import { address } from '../type.mappings';

export namespace VoteCreatedEvent {
  export const name: string = 'VoteCreated';

  export interface Log extends IContractLog {
    args: {
      contractAddress: address;
    };
  }
}
