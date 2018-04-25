import { NgModule } from '@angular/core';

import { EthereumService } from './ethereum/ethereum.service';
import { IPFSService } from './ipfs/ipfs.service';
import { TruffleContractService } from './ethereum/truffle-contract.service';
import { Web3Service } from './ethereum/web3.service';

@NgModule({
  providers: [
    EthereumService,
    IPFSService,
    TruffleContractService,
    Web3Service
  ]
})
export class CoreModule {
}
