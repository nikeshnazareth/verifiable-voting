import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'vv-datetime-picker-test',
  template: `
    <form [formGroup]="form">
      <vv-datetime-picker formControlName="dtpicker"></vv-datetime-picker>
    </form>
  `
})
export class DatetimePickerTestComponent implements OnInit {
  public form: FormGroup;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      dtpicker: [null]
    });
  }
}
