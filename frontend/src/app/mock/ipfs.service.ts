import { IIPFSService } from '../core/ipfs/ipfs.service';
import { Mock } from './module';
import { IVoteParameters } from '../core/vote-manager/vote-manager.service';


// Assume (for now) that all data corresponds to IVoteParameter objects and their hashes
// as recorded by the Mock.AnonymousVotingContractCollections object
export class IPFSService implements IIPFSService {

  addJSON(data: object): Promise<string> {
    // find the particular collection and return the corresponding hash
    if (data.hasOwnProperty('topic')) {
      return Promise.resolve(
        Mock.AnonymousVotingContractCollections
          .filter(collection => collection.parameters.topic === (<IVoteParameters> data).topic)[0]
          .params_hash
      );
    } else {
      throw new Error('IPFSService.addJSON argument is not of type IVoteParameters');
    }
  }

  catJSON(hash: string): Promise<object> {
    return Promise.resolve(
      Mock.AnonymousVotingContractCollections
        .filter(collection => collection.params_hash === hash)[0]
        .parameters
    );
  }
}
