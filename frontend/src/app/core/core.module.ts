import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { CryptographyService } from './cryptography/cryptography.service';
import { ErrorService } from './error-service/error.service';
import { AnonymousVotingContractService } from './ethereum/anonymous-voting-contract/contract.service';
import { NoRestrictionContractService } from './ethereum/no-restriction-contract/contract.service';
import { TruffleContractWrapperService } from './ethereum/truffle-contract-wrapper.service';
import { VoteListingContractService } from './ethereum/vote-listing-contract/contract.service';
import { Web3Service } from './ethereum/web3.service';
import { IPFSService } from './ipfs/ipfs.service';
import { TransactionService } from './transaction-service/transaction.service';
import { VoteManagerService } from './vote-manager/vote-manager.service';
import { VoteRetrievalService } from './vote-retrieval/vote-retrieval.service';
import { WindowSizeService } from './window-size/window-size.service';

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
    CryptographyService,
    TransactionService,
    WindowSizeService
  ],
  imports: [
    HttpClientModule
  ]
})
export class CoreModule {
}
