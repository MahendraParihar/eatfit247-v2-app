import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppError } from '../interfaces/app-error.interface';

@Injectable({
  providedIn: 'root',
})
export class ErrorNotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorSubject = new Subject<AppError>();

  /** Stream of classified HTTP errors. Subscribe for custom error handling. */
  readonly errors$ = this.errorSubject.asObservable();

  constructor() {
    this.errors$.subscribe((error) => this.showDefaultNotification(error));
  }

  /** Called by the error interceptor to emit a classified error. */
  emit(error: AppError): void {
    this.errorSubject.next(error);
  }

  private showDefaultNotification(error: AppError): void {
    this.snackBar.open(error.message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
