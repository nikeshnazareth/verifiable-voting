/**
 * Generic functions for interacting with the DOM during unit tests
 */

import { DebugElement } from '@angular/core';

export class DOMInteractionUtility {
  static setValueOn(element: DebugElement, value: string) {
    element.nativeElement.value = value;
    element.nativeElement.dispatchEvent(new Event('input')); // trigger change detection
  }

  static pressKeyOn(element: DebugElement, key: string) {
    element.nativeElement.dispatchEvent(new KeyboardEvent('keyup', {key: key}));
  }

  static clickOn(element: DebugElement) {
    element.nativeElement.click();
  }
}
