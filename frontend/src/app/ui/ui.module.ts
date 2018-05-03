import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { ListVotesComponent } from './list-votes/list-votes.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [
    LaunchVoteComponent,
    ListVotesComponent
  ],
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    CommonModule
  ],
  exports: [
    LaunchVoteComponent,
    ListVotesComponent
  ]
})
export class UiModule {
}
