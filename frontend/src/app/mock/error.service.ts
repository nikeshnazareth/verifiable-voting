
import { IErrorService } from '../core/error-service/error.service';
import { Observable } from 'rxjs/Observable';
import Spy = jasmine.Spy;

export class ErrorService implements IErrorService {
  public error$: Observable<Error> = null;
  public add: Spy = jasmine.createSpy('add');
}
