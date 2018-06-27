export class Web3Errors {
  static get account() {
    return new Error('There is no ethereum account selected.' +
      ' Please ensure you have signed into the Metamask extension (or another web3 provider)');
  }
}
