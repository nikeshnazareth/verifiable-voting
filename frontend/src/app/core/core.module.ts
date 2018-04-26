import { NgModule } from '@angular/core';

import { IPFSService } from './ipfs/ipfs.service';
import { TruffleContractService } from './ethereum/truffle-contract.service';
import { VoteListingContractService } from './ethereum/vote-listing-contract/vote-listing-contract.service';
import { Web3Service } from './ethereum/web3.service';
import { ErrorService } from './error-service/error-service';

@NgModule({
  providers: [
    ErrorService,
    VoteListingContractService,
    IPFSService,
    TruffleContractService,
    Web3Service
  ]
})
export class CoreModule {
}
