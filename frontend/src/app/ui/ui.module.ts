import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [LaunchVoteComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  exports: [LaunchVoteComponent]
})
export class UiModule {
}
