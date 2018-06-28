
export class VoteManagerMessages {
  static deploy(topic) {
    return `Deploy vote on topic: ${topic}`;
  }

  static register() {
    return 'Register to vote';
  }

  static vote() {
    return 'Cast ballot';
  }
}
