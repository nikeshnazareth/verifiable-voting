import { IContractLog } from '../contract.interface';
import { address } from '../type.mappings';

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
