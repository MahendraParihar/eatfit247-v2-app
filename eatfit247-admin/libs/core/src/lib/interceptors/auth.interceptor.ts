/**
 * Auth Interceptor
 * 
 * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md (authoritative)
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * 
 * Responsibilities:
 * - Adds Authorization header with in-memory access token
 * - Ensures withCredentials is set for HttpOnly cookie support
 * - Handles 401 errors by refreshing token and retrying request
 * - Access token stored in memory only (not localStorage)
 */
import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { environment } from '@env';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private storage = inject(StorageService);
  private auth = inject(AuthService);


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
          // Convert Promise to Observable using from()
          return from(this.auth.refreshToken()).pipe(
            switchMap((token) => {
              this.auth.setToken(token.accessToken);
              // Retry the original request with new token
              const retryRequest = clonedRequest.clone({
                setHeaders: {
                  Authorization: `Bearer ${token.accessToken}`,
                },
              });
              return next.handle(retryRequest);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}

