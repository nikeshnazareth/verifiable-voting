import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';
import { ExplanationComponent } from './explanation/explanation.component';
import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { ListVotesComponent } from './list-votes/list-votes.component';
import { RegistrationPhaseComponent } from './vote/registration/registration-phase.component';
import { ResultsComponent } from './vote/results/results-component';
import { VoteComponent } from './vote/vote-component';
import { VotingPhaseComponent } from './vote/voting/voting-phase.component';

@NgModule({
  declarations: [
    LaunchVoteComponent,
    ListVotesComponent,
    VoteComponent,
    RegistrationPhaseComponent,
    VotingPhaseComponent,
    ResultsComponent,
    ExplanationComponent
  ],
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    CommonModule
  ],
  exports: [
    LaunchVoteComponent,
    ListVotesComponent,
    VoteComponent,
    RegistrationPhaseComponent,
    VotingPhaseComponent,
    ResultsComponent,
    ExplanationComponent
  ]
})
export class UiModule {
}
