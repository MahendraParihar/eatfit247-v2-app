/**
 * Auth Interceptor
 *
 * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md (authoritative)
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 *
 * Responsibilities:
 * - Adds Authorization header with in-memory access token
 * - Ensures withCredentials is set for HttpOnly cookie support
 * - Handles 401 errors by delegating to TokenRefreshService (serialized)
 * - Access token stored in memory only (not localStorage)
 */
import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { environment } from '@env';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly tokenRefresh = inject(TokenRefreshService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    let clonedRequest = req;

    // Add Authorization header if access token exists (in-memory)
    if (this.auth.getToken()) {
      clonedRequest = clonedRequest.clone({
        setHeaders: {
          Authorization: `Bearer ${this.auth.getToken()}`,
        },
      });
    }

    // Ensure withCredentials is set for HttpOnly cookie support
    // This allows refresh token cookie to be sent/received automatically
    // Check if request is to our API (not external URLs)
    const apiUrl = environment.apiUrl;
    const isApiRequest = clonedRequest.url.startsWith(apiUrl) ||
                         clonedRequest.url.includes('/api/v2/admin') ||
                         clonedRequest.url.startsWith('/api/') ||
                         (!clonedRequest.url.startsWith('http://') && !clonedRequest.url.startsWith('https://'));

    if (isApiRequest) {
      clonedRequest = clonedRequest.clone({
        withCredentials: true,
      });
    }

    return next.handle(clonedRequest).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // Delegate to TokenRefreshService — concurrent 401s share a single refresh call
          return from(this.tokenRefresh.ensureFreshToken()).pipe(
            switchMap((newToken) => {
              // Retry the original request with the new token
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
                withCredentials: isApiRequest,
              });
              return next.handle(retryRequest);
            }),
            catchError((refreshError) => {
              this.auth.logout();
              return throwError(() => refreshError);
            }),
          );
        }
        return throwError(() => err);
      })
    );
  }
}
