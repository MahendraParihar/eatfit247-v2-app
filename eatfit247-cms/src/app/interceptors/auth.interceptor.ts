import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { StorageService } from '../service/storage.service';
import { HttpService } from '../service/http.service';
import { ApiUrlEnum } from '../enum/api-url-enum';
import { AESCryptoUtil } from '../utilites/crypto-aes';
import { NavigationService } from '../service/navigation.service';

/**
 * HTTP Interceptor for automatic token refresh on 401 errors
 * 
 * Features:
 * - Automatically refreshes access token when expired
 * - Retries failed requests with new token
 * - Prevents multiple simultaneous refresh requests
 * - Redirects to login if refresh fails
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private storageService: StorageService,
    private httpService: HttpService,
    private navigationService: NavigationService,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Don't add Authorization header here - HttpRequestInterceptor already does that
    // This interceptor only handles 401 errors and token refresh
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const user = this.storageService.getAuthUser();
        
        // Handle 401 Unauthorized errors (token expired)
        if (error.status === 401 && user && user.refreshToken) {
          // Skip refresh for login/refresh endpoints to avoid infinite loop
          const url = request.url.toLowerCase();
          if (url.includes('sign-in') || url.includes('refresh-token') || url.includes('logout')) {
            return throwError(() => error);
          }
          
          return this.handle401Error(request, next, user);
        }

        // For other errors, throw as normal
        return throwError(() => error);
      }),
    );
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
    user: any,
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = AESCryptoUtil.decryptUsingAES256(user.refreshToken);
      
      return this.refreshAccessToken(refreshToken).pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          
          if (response && response.data) {
            // Update stored tokens
            const updatedUser = this.storageService.getAuthUser();
            if (updatedUser) {
              updatedUser.accessToken = AESCryptoUtil.encryptUsingAES256(response.data.accessToken);
              updatedUser.refreshToken = AESCryptoUtil.encryptUsingAES256(response.data.refreshToken);
              updatedUser.authToken = updatedUser.accessToken; // Backward compatibility
              this.storageService.setAuthUser(updatedUser);
            }

            // Store encrypted token for refreshTokenSubject
            const encryptedAccessToken = AESCryptoUtil.encryptUsingAES256(response.data.accessToken);
            this.refreshTokenSubject.next(encryptedAccessToken);
            
            // Retry original request - HttpRequestInterceptor will add the new token
            return next.handle(request);
          }

          // If refresh fails, logout and redirect
          this.logout();
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => err);
        }),
      );
    } else {
      // If refresh is in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap(() => {
          // Retry original request - HttpRequestInterceptor will add the new token
          return next.handle(request);
        }),
      );
    }
  }

  private refreshAccessToken(refreshToken: string): Observable<any> {
    const payload = {
      refreshToken: refreshToken,
    };
    
    // Use HttpService to maintain consistency with error handling
    return new Observable((observer) => {
      this.httpService.postRequest(ApiUrlEnum.REFRESH_TOKEN, payload, false).then(
        (response) => {
          observer.next(response);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        },
      );
    });
  }

  private logout(): void {
    this.storageService.clearAuthUser();
    this.navigationService.navigateToLogin();
  }
}

