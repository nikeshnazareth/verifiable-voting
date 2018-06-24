import { NgModule } from '@angular/core';

import { CryptographyService } from './cryptography/cryptography.service';
import { ErrorService } from './error-service/error.service';
import { AnonymousVotingContractService } from './ethereum/anonymous-voting-contract/contract.service';
import { NoRestrictionContractService } from './ethereum/no-restriction-contract/contract.service';
import { TruffleContractWrapperService } from './ethereum/truffle-contract-wrapper.service';
import { VoteListingContractService } from './ethereum/vote-listing-contract/contract.service';
import { Web3Service } from './ethereum/web3.service';
import { IPFSService } from './ipfs/ipfs.service';
import { VoteManagerService } from './vote-manager/vote-manager.service';
import { VoteRetrievalService } from './vote-retrieval/vote-retrieval.service';

@NgModule({
  providers: [
    ErrorService,
    IPFSService,
    VoteRetrievalService,
    TruffleContractWrapperService,
    Web3Service,
    VoteListingContractService,
    AnonymousVotingContractService,
    VoteManagerService,
    NoRestrictionContractService,
    CryptographyService
  ]
})
export class CoreModule {
}
