/**
 * HTTP Error Interceptor
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Handles general HTTP errors (403, 500+, etc.)
 * Note: 401 errors are handled by AuthInterceptor
 */
import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private snackBar = inject(MatSnackBar);

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

        let errorMessage = 'An error occurred';
        
        if (error.status === 403) {
          errorMessage = 'Access forbidden. You do not have permission to perform this action.';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found. Please check your request and try again.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.status === 0) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });

        return throwError(() => error);
      })
    );
  }
}

