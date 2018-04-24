import { NgModule } from '@angular/core';
import { IPFSService } from './ipfs/ipfs.service';
import { EthereumService } from './ethereum/ethereum.service';
import { Web3Service } from './ethereum/web3.service';

@NgModule({
  providers: [
    IPFSService,
    EthereumService,
    Web3Service
  ]
})
export class CoreModule {
}
