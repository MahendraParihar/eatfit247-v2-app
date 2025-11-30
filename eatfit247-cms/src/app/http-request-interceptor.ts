import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { from, Observable, switchMap, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { Injectable, Injector } from '@angular/core';
import { ApiUrlEnum } from './enum/api-url-enum';
import { StorageService } from './service/storage.service';
import { AESCryptoUtil } from './utilites/crypto-aes';
import { AuthService } from 'src/app/service/auth.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  /*token: string;*/
  updatedRequest?: any;

  constructor(private storageService: StorageService, private authService: AuthService, private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.storageService.getAccessToken();
    let authReq = request;
    if (token) {
      authReq = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Try refresh token
          return from(this.authService.refreshToken()).pipe(
            switchMap((data) => {
              this.storageService.setAccessToken(data);
              const cloned = request.clone({
                setHeaders: { Authorization: `Bearer ${data}` }
              });
              return next.handle(cloned);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  private modifyBody(body: any, status: any): void {
  }
}
