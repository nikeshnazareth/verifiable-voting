import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';
import { DatetimePickerComponent } from './datetime-picker/datetime-picker.component';
import { ExplanationComponent } from './explanation/explanation.component';
import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { ListTransactionsComponent } from './list-transactions/list-transactions.component';
import { ListVotesComponent } from './list-votes/list-votes.component';
import { RegistrationPhaseComponent } from './vote/registration/registration-phase.component';
import { ResultsComponent } from './vote/results/results-component';
import { VoteComponent } from './vote/vote-component';
import { VotingPhaseComponent } from './vote/voting/voting-phase.component';

@NgModule({
  declarations: [
    DatetimePickerComponent,
    ExplanationComponent,
    LaunchVoteComponent,
    ListTransactionsComponent,
    ListVotesComponent,
    RegistrationPhaseComponent,
    ResultsComponent,
    VoteComponent,
    VotingPhaseComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CommonModule
  ],
  exports: [
    DatetimePickerComponent,
    ExplanationComponent,
    LaunchVoteComponent,
    ListTransactionsComponent,
    ListVotesComponent,
    RegistrationPhaseComponent,
    ResultsComponent,
    VoteComponent,
    VotingPhaseComponent
  ]
})
export class UiModule {
}
