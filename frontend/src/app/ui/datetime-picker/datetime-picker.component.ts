import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'vv-datetime-picker',
  templateUrl: './datetime-picker.component.html',
  styleUrls: ['./datetime-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatetimePickerComponent),
      multi: true
    }
  ]
})
export class DatetimePickerComponent implements OnInit, ControlValueAccessor {
  @Input() placeholder: string;

  hourOptions: number[];
  minuteOptions: number[];
  offsetOptions: number[];

  // To use this component as a form control, we need to call propagateChange whenever one of these values changes (through the view)
  // This is achieved by creating getter/setter proxies for each value
  private _date: Date;
  private _hours: number;
  private _minutes: number;
  private _offsetHours: number;

  /**
   * Initialise the options for the time and offset pickers
   */
  ngOnInit() {
    this.initTimePickers();
  }

  /**
   * This is called whenever the form control value is updated. Translate the specified date into its components
   * @param val the new date value of the component
   */
  writeValue(val: any) {
    if (val) {
      const newDate: Date = <Date> val;
      this._date = new Date(Date.UTC(newDate.getUTCFullYear(), newDate.getUTCMonth(), newDate.getUTCDate()));
      this._hours = newDate.getUTCHours();
      this._minutes = newDate.getUTCMinutes();
      this._offsetHours = 0;
    }
  }

  /**
   * @returns {Date} the combination of all this component's date/time pieces in a single Date value
   */
  get value(): Date {
    const msPerHour: number = 1000 * 60 * 60;
    if (this.date) {
      let componentTime = new Date(Date.UTC(
        this.date.getUTCFullYear(),
        this.date.getUTCMonth(),
        this.date.getUTCDate(),
        this.hours,
        this.minutes,
        0,
        0
      )).getTime();
      componentTime = componentTime - this.offsetHours * msPerHour;
      return new Date(componentTime);
    }
    return null;
  }

  /**
   * This function is called whenever any of the date components change, to update the output date value.
   * It will be overriden whenever this component is used as a form control
   * @param _
   */
  propagateChange(_: any) {
  }

  /**
   * Replace propogateChange with the specified fn ( which will be called whenever the date value of this component changes )
   * @param fn
   */
  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  /**
   * Empty function required to implement the ControlValueAccessor interface
   */
  registerOnTouched() {
  }

  // getters for the individual date components

  get date() {
    return this._date;
  }

  get hours() {
    return this._hours;
  }

  get minutes() {
    return this._minutes;
  }

  get offsetHours() {
    return this._offsetHours;
  }

  // setters for the individual date components that call propagateChange on update (to notify external forms)

  set date(d: Date) {
    this._date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    this.propagateChange(this.value);
  }

  set hours(h: number) {
    this._hours = h;
    this.propagateChange(this.value);
  }

  set minutes(m: number) {
    this._minutes = m;
    this.propagateChange(this.value);
  }

  set offsetHours(offset: number) {
    this._offsetHours = offset;
    this.propagateChange(this.value);
  }

  /**
   * @param {number} n the number to convert
   * @returns {string} a string version of the specified number, padded with 0s to two digits
   */
  padToTwoDigits(n: number): string {
    return String(n).padStart(2, '0');
  }

  /**
   * @param {number} n the number to convert
   * @returns {string} a string version of the specified number, with the +/- sign prepended
   */
  addSign(n: number): string {
    return n < 0 ? String(n) : '+' + String(n);
  }

  /**
   * Initialise the time pickers to have the appropriate range of options
   */
  private initTimePickers() {
    this.hourOptions = this.range(24);
    this.minuteOptions = this.range(60);
    this.offsetOptions = this.range(27).map(val => val - 12); // produce a value between -12 and 14

    this.hours = 0;
    this.minutes = 0;
    this.offsetHours = this.getOffsetHours(new Date()); // use the current timezone by default
  }

  /**
   * @param {Date} date the date to compare
   * @returns {number} the difference in hours between the date timezone and UTC
   */
  private getOffsetHours(date: Date) {
    return -1 * date.getTimezoneOffset() / 60;
  }

  /**
   * @param {number} N the desired array length
   * @returns {number[]} an array of numbers from 0 to N-1
   */
  private range(N: number) {
    return Array(N).fill(0).map((val, idx) => idx);
  }
}
