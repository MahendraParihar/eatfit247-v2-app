/**
 * HTTP Error Interceptor
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Handles general HTTP errors (403, 500+, etc.)
 * Note: 401 errors are handled by AuthInterceptor
 */
import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

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

        if (error.status === 403) {
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', error.message);
          // Optionally redirect to unauthorized page
          // this.router.navigate(['/unauthorized']);
        } else if (error.status === 404) {
          // Not found
          console.error('Resource not found:', error.message);
        } else if (error.status >= 500) {
          // Server error
          console.error('Server error:', error.message);
        } else if (error.status === 0) {
          // Network error or CORS issue
          console.error('Network error - please check your connection');
        }

        return throwError(() => error);
      })
    );
  }
}

