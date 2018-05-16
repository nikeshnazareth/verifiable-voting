import { IContractEventStream, IContractLog } from '../core/ethereum/contract.interface';

export interface ITriggerableEventStream extends IContractEventStream {
  trigger(err: Error, log: IContractLog): void;
}

export class TriggerableEventStream implements ITriggerableEventStream {
  private callback: (err: Error, log: IContractLog) => void;

  watch(cb: (err: Error, log: IContractLog) => void) {
    this.callback = cb;
  }

  stopWatching() {
    this.callback = null;
  }

  trigger(err: Error, log: IContractLog): void {
    this.callback(err, log);
  }
}
