import {HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {retry, tap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {ApiUrlEnum} from './enum/api-url-enum';
import {StorageService} from "./service/storage.service";
import {AESCryptoUtil} from "./utilites/crypto-aes";

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  /*token: string;*/
  updatedRequest?: any;

  constructor(private storageService: StorageService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = ApiUrlEnum.BASE_URL + request.url;
    const body = request.body;
    let headerIn;
    if (!request.hasOwnProperty('headers') || !request.headers) {
      headerIn = new HttpHeaders();
      headerIn = headerIn
        .set('Content-Type', 'application/json; charset=utf-8')
    } else {
      headerIn = request.headers;
    }
    headerIn = headerIn
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache');

    const user = this.storageService.getAuthUser();
    if (user) {
      headerIn = headerIn.set('Authorization', `Bearer ${AESCryptoUtil.decryptUsingAES256(user.authToken)}`);
    }

    this.updatedRequest = request.clone({
      headers: headerIn,
      url,
      body
    });

    return next
      .handle(this.updatedRequest)
      .pipe(
        tap((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse) {
              event = event.clone({body: this.modifyBody(event.body, event.status)});
            }
            return event;
          }
        )
      );
  }

  private modifyBody(body: any, status: any): void {
  }
}
