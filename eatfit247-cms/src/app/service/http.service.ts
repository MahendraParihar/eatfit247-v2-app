import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {timeout} from 'rxjs/operators';
import {ErrorHandlerService} from './error-handler.service';
import {ResponseDataModel} from "../models/response-data.model";
import {LoaderService} from "./loader.service";
import {ApiUrlEnum} from "../enum/api-url-enum";
import {firstValueFrom, Observable} from "rxjs";
import {keysIn} from "lodash";
import {saveAs} from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  DEFAULT_TIME_OUT = 30000;

  constructor(private http: HttpClient,
              private loaderService: LoaderService,
              private errorService: ErrorHandlerService) {
  }

  private static convertMapToUrlParam(url: any, data: any): string {
    if (data) {
      url = `${url}?`;
      const keys = keysIn(data);
      let counter = 0;
      for (const key of keys) {
        if (data[key] || data[key] === false) {
          url = url.concat(key).concat('=').concat(data[key]);
          if (counter !== keys.length - 1) {
            url = url.concat('&&');
          }
        }
        counter++;
      }
    }
    return url;
  }

  public async postRequest(url: any, postData: any = {}, showWaiting: boolean): Promise<any> {
    if (showWaiting) {
      this.loaderService.load();
    }
    try {
      const resp = await firstValueFrom(this.http.post(url, postData).pipe(timeout(this.DEFAULT_TIME_OUT)));
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      if (resp) {
        return this.convertResponse(resp);
      }
      return this.returnNull();
    } catch (e: any) {
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      this.errorService.handleError(e);
      return this.returnNull();
    }

  }

  public async patchRequest(url: any, id: number, postData: any = {}, showWaiting: boolean): Promise<any> {
    if (showWaiting) {
      this.loaderService.load();
    }
    try {
      const resp = await firstValueFrom(this.http.patch(url + '/' + id, postData).pipe(timeout(this.DEFAULT_TIME_OUT)));
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      if (resp) {
        return this.convertResponse(resp);
      }
      return this.returnNull();
    } catch (e: any) {
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      this.errorService.handleError(e);
      return this.returnNull();
    }

  }

  public async deleteRequest(url: any, id: number, showWaiting: boolean): Promise<any> {
    if (showWaiting) {
      this.loaderService.load();
    }
    try {
      const resp = await firstValueFrom(this.http.delete(url + '/' + id).pipe(timeout(this.DEFAULT_TIME_OUT)));
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      if (resp) {
        return this.convertResponse(resp);
      }
      return this.returnNull();
    } catch (e: any) {
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      this.errorService.handleError(e);
      return this.returnNull();
    }

  }

  public async putRequest(url: any, id: number, postData: any = {}, showWaiting: boolean): Promise<any> {
    if (showWaiting) {
      this.loaderService.load();
    }
    try {
      if (id) {
        url = `${url}/${id}`;
      }
      const resp = await firstValueFrom(this.http.put(url, postData).pipe(timeout(this.DEFAULT_TIME_OUT)));
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      if (resp) {
        return this.convertResponse(resp);
      }
      return this.returnNull();
    } catch (e: any) {
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      this.errorService.handleError(e);
      return this.returnNull();
    }

  }

  public async getRequest(url: any, id: number = null, postData: any, showWaiting: boolean): Promise<any> {
    if (showWaiting) {
      this.loaderService.load();
    }
    try {
      if (id) {
        url = `${url}/${id}`;
      }
      url = HttpService.convertMapToUrlParam(url, postData);
      const resp = await firstValueFrom(this.http.get<ResponseDataModel>(url).pipe(timeout(this.DEFAULT_TIME_OUT)));
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      if (resp) {
        return this.convertResponse(resp);
      }
      return this.returnNull();
    } catch (e: any) {
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      this.errorService.handleError(e);
      return this.returnNull();
    }
  }

  public uploadMedia(formData: FormData): Observable<HttpEvent<any>> {
    let headerIn = new HttpHeaders();
    headerIn = headerIn
      .set('Content-Type', 'multipart/form-data')
      .set('enctype', 'multipart/form-data')
    const req = new HttpRequest('POST', ApiUrlEnum.MEDIA_UPLOAD, formData, {
      reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);
  }

  public async downloadFile(url: string, fileName: string, showWaiting: boolean = true) {
    try {
      if (showWaiting) {
        this.loaderService.load();
      }
      saveAs(`${ApiUrlEnum.DOWNLOAD_PATH}${url}`, fileName);
      if (showWaiting) {
        this.loaderService.dismiss();
      }
    } catch (e: any) {
      if (showWaiting) {
        this.loaderService.dismiss();
      }
      this.errorService.handleError(e);
      return this.returnNull();
    }
  }

  public returnNull(): any {
    return null;
  }

  private convertResponse(response: any): ResponseDataModel {
    let responseObject: ResponseDataModel;
    if (response) {
      responseObject = {
        code: response['code'],
        message: response['message'],
        data: response['data'],
      };
    } else {
      responseObject = {
        code: response['code'],
        message: response['message']
      };
    }
    console.log(responseObject);
    return responseObject;
  }
}
