import { IIPFSService } from '../core/ipfs/ipfs.service';
import { Mock } from './module';
import { IBlindedAddress, IBlindedSignature, IVote, IVoteParameters } from '../core/vote-manager/vote-manager.service';

export class IPFSService implements IIPFSService {

  addJSON(data: object): Promise<string> {
    if (data.hasOwnProperty('topic')) {
      return Promise.resolve(
        Mock.AnonymousVotingContractCollections
          .filter(collection => collection.parameters.topic === (<IVoteParameters> data).topic)[0]
          .params_hash
      );
    }

    if (data.hasOwnProperty('blinded_address')) {
      return Promise.resolve(
        Mock.Voters
          .filter(voter => voter.blinded_address === (<IBlindedAddress> data).blinded_address)[0]
          .blinded_address_hash
      );
    }

    if (data.hasOwnProperty('blinded_signature')) {
      return Promise.resolve(
        Mock.Voters
          .filter(voter => voter.signed_blinded_address === (<IBlindedSignature> data).blinded_signature)[0]
          .signed_blinded_address_hash
      );
    }

    if (data.hasOwnProperty('signed_address')) {
      return Promise.resolve(
        Mock.Voters
          .filter(voter => voter.vote.signed_address === (<IVote> data).signed_address)[0]
          .vote_hash
      );
    }

    throw new Error('Unexpected data added to the Mock IPFS service');
  }

  catJSON(hash: string): Promise<object> {
    const matchingContracts = Mock.AnonymousVotingContractCollections
      .filter(collection => collection.params_hash === hash);
    if (matchingContracts.length > 0) {
      return Promise.resolve(matchingContracts[0].parameters);
    }

    const matchingVotersByBlindedAddress = Mock.Voters.filter(voter => voter.blinded_address_hash === hash);
    if (matchingVotersByBlindedAddress.length > 0) {
      return Promise.resolve({
        blinded_address: matchingVotersByBlindedAddress[0].blinded_address
      });
    }

    const matchingVotersByBlindedSignature = Mock.Voters.filter(voter => voter.signed_blinded_address_hash === hash);
    if (matchingVotersByBlindedSignature.length > 0) {
      return Promise.resolve({
        blinded_signature: matchingVotersByBlindedSignature[0].signed_blinded_address
      });
    }

    const matchingVotersByVote = Mock.Voters.filter(voter => voter.vote_hash === hash);
    if (matchingVotersByVote.length > 0) {
      return Promise.resolve(matchingVotersByVote[0].vote)
    }

    throw new Error('Unexpected hash requested from the Mock IPFS service');
  }
}
