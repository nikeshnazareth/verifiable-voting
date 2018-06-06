import { IBigNumber } from '../core/ethereum/web3.service';

export class BigNumber implements IBigNumber {
  private value: number;

  constructor(n: number) {
    this.value = n;
  }

  toNumber(): number {
    return this.value;
  }
}
