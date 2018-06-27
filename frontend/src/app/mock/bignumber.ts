import { IBigNumber } from '../core/ethereum/type.mappings';

export class BigNumber implements IBigNumber {
  private value: number;

  constructor(n: number) {
    this.value = n;
  }

  toNumber(): number {
    return this.value;
  }
}
