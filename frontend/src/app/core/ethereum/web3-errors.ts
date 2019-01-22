export class Web3Errors {
  static get account() {
    return new Error('There is no ethereum account selected.' +
      ' Please ensure you have signed into and granted account access to the Metamask extension');
  }

  static get unauthorised() {
    return new Error('Unable to create transaction. Please ensure you have granted account access to the MetaMask extension');
  }
}
