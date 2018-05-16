import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { ListVotesComponent } from './list-votes/list-votes.component';
import { VoteComponent } from './vote/vote-component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [
    LaunchVoteComponent,
    ListVotesComponent,
    VoteComponent
  ],
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    CommonModule
  ],
  exports: [
    LaunchVoteComponent,
    ListVotesComponent,
    VoteComponent
  ]
})
export class UiModule {
}
