import { NgModule } from '@angular/core';
import { IPFSService } from './ipfs/ipfs.service';

@NgModule({
  providers: [IPFSService]
})
export class CoreModule {
}
