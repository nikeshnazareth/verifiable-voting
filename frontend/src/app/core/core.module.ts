import { NgModule } from '@angular/core';

import { IPFSService } from './ipfs/ipfs.service';
import { TruffleContractWrapperService } from './ethereum/truffle-contract-wrapper.service';
import { VoteListingContractService } from './ethereum/vote-listing-contract/contract.service';
import { Web3Service } from './ethereum/web3.service';
import { ErrorService } from './error-service/error.service';
import { VoteManagerService } from './vote-manager/vote-manager.service';
import { ReplacementAnonymousVotingContractService } from './ethereum/anonymous-voting-contract/replacement-contract.service';
import { NoRestrictionContractService } from './ethereum/no-restriction-contract/contract.service';
import { VoteRetrievalService } from './vote-retrieval/vote-retrieval.service';
import { CryptographyService } from './cryptography/cryptography.service';

@NgModule({
  providers: [
    ErrorService,
    IPFSService,
    VoteRetrievalService,
    TruffleContractWrapperService,
    Web3Service,
    VoteListingContractService,
    ReplacementAnonymousVotingContractService,
    VoteManagerService,
    NoRestrictionContractService,
    CryptographyService
  ]
})
export class CoreModule {
}
