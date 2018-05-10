import { NgModule } from '@angular/core';

import { IPFSService } from './ipfs/ipfs.service';
import { TruffleContractWrapperService } from './ethereum/truffle-contract-wrapper.service';
import { VoteListingContractService } from './ethereum/vote-listing-contract/contract.service';
import { Web3Service } from './ethereum/web3.service';
import { ErrorService } from './error-service/error.service';
import { VoteManagerService } from './vote-manager/vote-manager.service';
import { AnonymousVotingContractService } from './ethereum/anonymous-voting-contract/contract.service';
import { NoRestrictionContractService } from './ethereum/no-restriction-contract/contract.service';

@NgModule({
  providers: [
    ErrorService,
    IPFSService,
    TruffleContractWrapperService,
    Web3Service,
    VoteListingContractService,
    AnonymousVotingContractService,
    VoteManagerService,
    NoRestrictionContractService
  ]
})
export class CoreModule {
}
