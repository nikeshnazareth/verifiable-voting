export interface ITransactionState {
  description: string;
  status: string;
}

export const TransactionStatus = {
  pending: 'PENDING',
  success: 'SUCCESS',
  failure: 'FAILURE'
};
