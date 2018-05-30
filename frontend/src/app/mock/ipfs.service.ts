import { IIPFSService } from '../core/ipfs/ipfs.service';
import { Mock } from './module';
import { IBlindedAddress, IVoteParameters } from '../core/vote-manager/vote-manager.service';

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

    throw new Error('Unexpected data added to the Mock IPFS service');
  }

  catJSON(hash: string): Promise<object> {
    const matchingContracts = Mock.AnonymousVotingContractCollections
      .filter(collection => collection.params_hash === hash);
    if (matchingContracts.length > 0) {
      return Promise.resolve(matchingContracts[0].parameters);
    }

    const matchingVoters = Mock.Voters.filter(voter => voter.blinded_address_hash === hash);
    if (matchingVoters.length > 0) {
      return Promise.resolve({
        blinded_address: matchingVoters[0].blinded_address
      });
    }

    throw new Error('Unexpected hash requested from the Mock IPFS service');
  }
}
