import { address } from './type.mappings';

export interface IContract {
  address: address;
  allEvents(): IContractEventStream;
}

export interface IContractEventStream {
  watch(cb: (err: Error, log: IContractLog) => void): void;
}

export interface IContractLog {
  event: string;
  args: object;
}
