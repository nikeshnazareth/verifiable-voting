// Type mappings from solidity to javascript
// These do not enforce sizes or structure - they simply document intention

export interface IBigNumber {
  toNumber(): number;
}

export type address = string;
export type uint = IBigNumber;




