import { Component } from '@angular/core';
import { Web3Service } from '../../core/ethereum/web3.service';

@Component({
  selector: 'vv-connect-ethereum',
  template: `
    <div class="container">
      <h2>Configure your browser to work with Ethereum</h2>
      <ul>
        <li>
          <mat-icon *ngIf="web3Injected; else web3Missing">check_box</mat-icon>
          <ng-template #web3Missing>
            <mat-icon>check_box_outline_blank</mat-icon>
          </ng-template>
          <span>Install the <a href="https://metamask.io">MetaMask</a> browser extension</span>
        </li>
        <li>
          <!-- Note that we know we're not on the Rinkeby Network since this component wouldn't load if we were -->
          <mat-icon>check_box_outline_blank</mat-icon>
          <span>Choose the Rinkeby Test Network</span>
        </li>
      </ul>
    </div>
  `,
  styleUrls: ['./connect-ethereum.scss']
})
export class ConnectEthereumComponent {
  public web3Injected: boolean;

  constructor(private web3Svc: Web3Service) {
    this.web3Injected = this.web3Svc.currentProvider !== null;
  }
}
