export class VoteManagerErrors {
  static get ipfs() {
    return {
      addParametersHash: (params) => new Error(`Unable to add parameters (${params}) to IPFS`),
      addBlindedAddress: () => new Error('Unable to add blinded address to IPFS'),
      addBlindSignature: () => new Error('Unable to add blind signature to IPFS'),
      addVote: () => new Error('Unable to add the vote to IPFS')
    };
  }

  static unauthorised() {
    return new Error('The specified anonymous address and blinding factor do not match the registered values');
  }
}
