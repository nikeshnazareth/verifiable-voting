import { address } from '../ethereum/type.mappings';

export class VoteManagerMessages {
  static deploy(topic) {
    return `Deploy vote on topic: ${topic}`;
  }

  static register(voter: address, contract: address) {
    return `Register voter ${voter} at contract ${contract}`;
  }

  static vote(contract: address) {
    return `Voting at contract ${contract}`;
  }
}
