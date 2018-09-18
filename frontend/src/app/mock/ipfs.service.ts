import { Observable } from 'rxjs/Observable';

import { IVote } from '../core/ipfs/formats.interface';
import { IBlindedAddress, IBlindSignature, IVoteParameters } from '../core/ipfs/formats.interface';
import { IIPFSService } from '../core/ipfs/ipfs.service';
import { Mock } from './module';

export class IPFSService implements IIPFSService {

  addJSON(data: object): Observable<string> {
    if (data.hasOwnProperty('topic')) {
      return Observable.of(
        Mock.AnonymousVotingContractCollections
          .filter(collection => collection.parameters.topic === (<IVoteParameters> data).topic)[0]
          .voteConstants.paramsHash
      );
    }

    if (data.hasOwnProperty('blinded_address')) {
      return Observable.of(
        Mock.Voters
          .filter(voter => voter.blinded_address === (<IBlindedAddress> data).blinded_address)[0]
          .blinded_address_hash
      );
    }

    if (data.hasOwnProperty('blinded_signature')) {
      return Observable.of(
        Mock.Voters
          .filter(voter => voter.signed_blinded_address === (<IBlindSignature> data).blinded_signature)[0]
          .signed_blinded_address_hash
      );
    }

    if (data.hasOwnProperty('signed_address')) {
      return Observable.of(
        Mock.Voters
          .filter(voter => voter.vote.signed_address === (<IVote> data).signed_address)[0]
          .vote_hash
      );
    }

    return Observable.throwError(new Error('Unexpected data added to the Mock IPFS service'));
  }

  catJSON(hash: string): Observable<object> {
    const matchingContracts = Mock.AnonymousVotingContractCollections
      .filter(collection => collection.voteConstants.paramsHash === hash);
    if (matchingContracts.length > 0) {
      return Observable.of(matchingContracts[0].parameters);
    }

    const matchingVotersByBlindedAddress = Mock.Voters.filter(voter => voter.blinded_address_hash === hash);
    if (matchingVotersByBlindedAddress.length > 0) {
      return Observable.of({
        blinded_address: matchingVotersByBlindedAddress[0].blinded_address
      });
    }

    const matchingVotersByBlindedSignature = Mock.Voters.filter(voter => voter.signed_blinded_address_hash === hash);
    if (matchingVotersByBlindedSignature.length > 0) {
      return Observable.of({
        blinded_signature: matchingVotersByBlindedSignature[0].signed_blinded_address
      });
    }

    const matchingVotersByVote = Mock.Voters.filter(voter => voter.vote_hash === hash);
    if (matchingVotersByVote.length > 0) {
      return Observable.of(matchingVotersByVote[0].vote);
    }

    return Observable.throwError(new Error('Unexpected hash requested from the Mock IPFS service'));
  }
}
