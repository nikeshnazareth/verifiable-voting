export class VoteRetrievalErrors {
  static get ipfs() {
    return {
      nullHash: new Error('Attempting to retrieve null IPFS hash'),
      retrieval: new Error('Unable to retrieve the object from IPFS')
    };
  }

  static get format() {
    return {
      parameters: (params) => new Error(`Retrieved parameters object (${params}) does not match the expected format`),
      blindedAddress: (blindedAddress) => new Error(`Retrieved blinded address (${blindedAddress} does not match the expected format`),
      blindSignature: (sig) => new Error(`Retrieved blind signature (${sig} does not match the expected format`),
      vote: (vote) => new Error(`Retrieved vote (${vote}) does not match the expected format`)
    };
  }

  static get registration() {
    return new Error('There was an inconsistency during registration preventing the vote from continuing');
  }
}
