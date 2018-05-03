
// Transaction Receipts are returned from contract functions that modify the blockchain
// At the moment, the receipt is ignored
// but this empty interface is used for code clarity (and extensibility)

export interface ITransactionReceipt {} // tslint:disable-line

// All Ethereum transactions can be configured with a properties object
// This interface captures the configurations used in this app
export interface ITransactionProperties {
  from: string;
}
