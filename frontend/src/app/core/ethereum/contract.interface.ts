import { address } from './type.mappings';

export interface IContract {
  address: address;
  allEvents(filter?: IFilter): IContractEventStream;
}

export interface IContractEventStream {
  watch(cb: (err: Error, log: IContractLog) => void): void;
  stopWatching(): void;
}

export interface IContractLog {
  event: string;
  args: object;
}

interface IFilter {
  fromBlock: number;
  toBlock: string;
}
