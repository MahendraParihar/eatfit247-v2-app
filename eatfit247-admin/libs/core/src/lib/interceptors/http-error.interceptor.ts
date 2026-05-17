/**
 * HTTP Error Interceptor
 *
 * Classifies HTTP errors into typed discriminated unions (AppError)
 * and delegates display to ErrorNotificationService.
 *
 * Components can suppress the default snackbar for specific requests
 * by setting SUPPRESS_ERROR_NOTIFICATION in the HttpContext.
 *
 * Note: 401 errors are handled by AuthInterceptor.
 */
import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorNotificationService } from '../services/error-notification.service';
import { AppError, SUPPRESS_ERROR_NOTIFICATION } from '../interfaces/app-error.interface';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly errorNotification = inject(ErrorNotificationService);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Skip 401 errors - handled by AuthInterceptor
        if (error.status === 401) {
          return throwError(() => error);
        }

        const appError = this.classify(error);

        if (!request.context.get(SUPPRESS_ERROR_NOTIFICATION)) {
          this.errorNotification.emit(appError);
        }

        return throwError(() => appError);
      })
    );
  }

  private classify(error: HttpErrorResponse): AppError {
    const base = {
      status: error.status,
      message: this.extractMessage(error),
      originalError: error,
    };

    switch (error.status) {
      case 0:
        return { ...base, kind: 'network', status: 0 as const };
      case 400:
        return { ...base, kind: 'validation', status: 400 as const };
      case 403:
        return { ...base, kind: 'forbidden', status: 403 as const };
      case 404:
        return { ...base, kind: 'not-found', status: 404 as const };
      case 422:
        return { ...base, kind: 'validation', status: 422 as const };
      default:
        if (error.status >= 500) {
          return { ...base, kind: 'server' };
        }
        return { ...base, kind: 'unknown' };
    }
  }

  private extractMessage(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return 'Access forbidden. You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'Resource not found. Please check your request and try again.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (error.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.error?.message || error.message || 'An error occurred';
  }
}
