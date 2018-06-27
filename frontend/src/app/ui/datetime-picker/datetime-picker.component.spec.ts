import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MaterialModule } from '../../material/material.module';
import { DatetimePickerTestComponent } from './datetime-picker-test.component.spec';
import { DatetimePickerComponent } from './datetime-picker.component';

fdescribe('Component: DatetimePickerComponent', () => {
  let fixture: ComponentFixture<DatetimePickerTestComponent>;

  class Page {
    static get datepickerfield(): DebugElement {
      return fixture.debugElement.query(By.css('.date-picker'));
    }

    static get ctrl(): AbstractControl {
      return fixture.componentInstance.form.get('dtpicker');
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DatetimePickerComponent,
        DatetimePickerTestComponent
      ],
      imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(DatetimePickerTestComponent);
      });
  }));

  beforeEach(() => fixture.detectChanges());

  describe('Field: Date picker', () => {
    let input: DebugElement;
    let toggle: DebugElement;
    let datepicker: DebugElement;

    beforeEach(() => {
      input = Page.datepickerfield.query(By.css('input[type="text"]'));
      toggle = Page.datepickerfield.query(By.css('mat-datepicker-toggle'));
      datepicker = Page.datepickerfield.query(By.css('mat-datepicker'));
    });

    describe('Structure', () => {
      it('should exist', () => {
        expect(Page.datepickerfield).not.toBeNull();
      });

      it('should contain a text input element', () => {
        expect(input).not.toBeNull();
      });

      it('should contain a datepicker toggle', () => {
        expect(toggle).not.toBeNull();
      });

      it('should contain a datepicker', () => {
        expect(datepicker).not.toBeNull();
      });
    });

    describe('Functionality', () => {
      describe('Field: Date picker', () => {
        xit('should open the date picker when the toggle is selected');

        xit('should set the input value when a date is chosen in the date picker');

        xit('should update whenever the DatetimePicker value is set');

        xit('should update the DatetimePicker value whenever a date is chosen');

        xit('should be invalid when the DatetimePicker value is before the specified minimum');

        xit('should be invalid when the DatetimePicker value is after the specified maximum');
      });

      xdescribe('Field: Hour picker', () => {
      });

      xdescribe('Field: Minute picker', () => {
      });

      xdescribe('Field: Offset picker', () => {
      });
    });
  });
});
