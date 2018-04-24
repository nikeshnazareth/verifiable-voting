import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { LaunchVoteComponent } from './launch-vote/launch-vote.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [LaunchVoteComponent],
  imports: [
    ReactiveFormsModule,
    MaterialModule
  ],
  exports: [LaunchVoteComponent]
})
export class UiModule {
}
