import { Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

@Injectable()
export class WindowSizeService implements IWindowService {
  readonly innerWidth$: ReplaySubject<number>;

  constructor(private eventManager: EventManager) {
    this.innerWidth$ = new ReplaySubject<number>();
    this.innerWidth$.next(window.innerWidth);
    this.eventManager.addGlobalEventListener('window', 'resize', this.onResize.bind(this));
  }

  get isMobile$(): Observable<boolean> {
    return this.innerWidth$.map(width => width < 768);
  }

  private onResize(event: UIEvent) {
    this.innerWidth$.next((<Window>event.target).innerWidth);
  }
}

interface IWindowService {
  isMobile$: Observable<boolean>;
}
