import { APP_CONFIG } from '../../../config';

export class VoteListingContractErrors {
  static get network() {
    return new Error('Cannot find the VoteListing contract on the blockchain. ' +
      `Ensure MetaMask (or the web3 provider) is connected to the ${APP_CONFIG.network.name}`);
  }

  static get voteCreated() {
    return new Error('Cannot listen for VoteCreated events on the VoteListing contract. ' +
      'No new contracts will be displayed');
  }

  static get eventError() {
    return new Error('Unexpected error in the VoteListing contract event stream');
  }

  static get deployVote() {
    return new Error('Unable to deploy a new AnonymousVoting contract');
  }

  static get deployedVotes() {
    return new Error('Unable to obtain AnonymousVoting contracts from the VoteListing contract');
  }

  static contractAddress(i: number) {
    return new Error(`Unable to retrieve voting contract ${i} (0-up indexing)`);
  }
}
