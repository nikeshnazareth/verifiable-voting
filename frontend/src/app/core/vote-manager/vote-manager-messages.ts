
export class VoteManagerMessages {
  static deploy(topic) {
    return `Deploy vote on topic: ${topic}`;
  }

  static register() {
    return 'Register to vote';
  }

  static completeRegistration() {
    return 'Complete registration (as Registration Authority)';
  }

  static vote() {
    return 'Cast ballot';
  }
}
