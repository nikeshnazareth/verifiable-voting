import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { ListVotesComponent } from './list-votes/list-votes.component';
import { VoteComponent } from './vote/vote-component';
import { RegistrationPhaseComponent } from './vote/registration-phase.component';
import { VotingPhaseComponent } from './vote/voting-phase.component';
import { CompletePhaseComponent } from './vote/complete-phase-component';

@NgModule({
  declarations: [
    LaunchVoteComponent,
    ListVotesComponent,
    VoteComponent,
    RegistrationPhaseComponent,
    VotingPhaseComponent,
    CompletePhaseComponent
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
    CompletePhaseComponent
  ]
})
export class UiModule {
}
