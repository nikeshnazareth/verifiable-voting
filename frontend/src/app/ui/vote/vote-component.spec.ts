import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { VoteComponent } from './vote-component';
import { MaterialModule } from '../../material/material.module';

fdescribe('Component: VoteComponent', () => {
  let fixture: ComponentFixture<VoteComponent>;
  let page: Page;

  class Page {
    public container: DebugElement;
    public title: DebugElement;

    constructor() {
      this.container = fixture.debugElement.query(By.css('.container'));
      this.title = this.container.query(By.css('h2'));
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        VoteComponent
      ],
      imports: [
        MaterialModule
      ],
      providers: []
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(VoteComponent);
        page = new Page();
      });
  }));

  describe('Structure', () => {
    it('should have a container element', () => {
      fixture.detectChanges();
      expect(page.container).toBeTruthy();
    });

    it('should have a title element', () => {
      fixture.detectChanges();
      expect(page.title).toBeTruthy();
    });
  });

  describe('Title', () => {
    xit('should state "Vote #[index]" where index is ');
  });

  describe('Functionality', () => {

    describe('container', () => {
      it('should be hidden initially', () => {
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(true);
      });

      it('should become visible when input is set', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(false);
      });

      it('should become visible when input is set to zero', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 0;
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(false);
      });

      it('sohuld stay visible with subsequent changes to input', () => {
        fixture.detectChanges();
        fixture.componentInstance.index = 2;
        fixture.detectChanges();
        fixture.componentInstance.index = 3;
        fixture.detectChanges();
        expect(page.container.nativeElement.hidden).toEqual(false);
      });
    });
  });
});
