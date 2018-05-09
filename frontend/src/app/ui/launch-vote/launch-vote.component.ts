import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'vv-launch-vote',
  templateUrl: './launch-vote.component.html'
})
export class LaunchVoteComponent implements OnInit {
  protected launchVoteForm: FormGroup;
  private minRegistrationClosesDate: Date;
  private minVotingClosesDate$: Observable<Date>;

  public constructor(private fb: FormBuilder) {
  }

  ngOnInit() {
    this.createForm();
  }

  private createForm() {
    this.launchVoteForm = this.fb.group({
      topic: ['', Validators.required],
      timeframes: this.fb.group({
        registrationOpens: [{value: new Date(), disabled: true}, Validators.required],
        registrationCloses: ['', Validators.required],
        votingCloses: ['', Validators.required]
      })
    });

    this.minRegistrationClosesDate = this.dayAfter(this.launchVoteForm.get('timeframes.registrationOpens').value);

    this.minVotingClosesDate$ = this.launchVoteForm.get('timeframes.registrationCloses').valueChanges
      .startWith(null)
      .map(date => date ? date : this.minRegistrationClosesDate)
      .map(this.dayAfter);
  }

  /**
   * @param {Date} d the original date
   * @returns {Date} the day after the specified date
   */
  private dayAfter(d: Date) {
    const msPerDay: number = 1000 * 60 * 60 * 24;
    return new Date(d.getTime() + msPerDay);
  }
}
