import { Observable } from 'rxjs/Observable';

import { IRSAKey } from '../core/cryptography/rsa-key.interface';
import { address } from '../core/ethereum/type.mappings';
import { IVoteParameters } from '../core/ipfs/formats.interface';
import { IVoteManagerService} from '../core/vote-manager/vote-manager.service';

export class VoteManagerService implements IVoteManagerService {
  deployVote$(registrationDeadline: number,
              votingDeadline: number,
              params: IVoteParameters,
              eligibilityContract: address,
              registrationAuthority: address): Observable<void> {
    return Observable.of(undefined);
  }

  registerAt$(contractAddr: address,
              registrationKey: IRSAKey,
              voterAddr: address,
              anonymousAddr: address,
              blindingFactor: string): Observable<void> {
    return Observable.of(undefined);
  }

  voteAt$(contractAddr: address,
          registrationKey: IRSAKey,
          anonymousAddr: address,
          blindedSignature: string,
          blindingFactor: string,
          candidateIdx: number): Observable<void> {
    return Observable.of(undefined);
  }
}
