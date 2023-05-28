import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../../service/http.service';
import { SnackBarService } from '../../service/snack-bar.service';
import { ApiUrlEnum } from '../../enum/api-url-enum';
import { ServerResponseEnum } from '../../enum/server-response-enum';
import { ReferrerModel } from '../../models/referrer.model';
import { CommonUtil } from 'src/app/utilites/common-util';

export class ReferrerDatasource implements DataSource<ReferrerModel> {
  private dataSubject = new BehaviorSubject<ReferrerModel[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<ReferrerModel[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(url: ApiUrlEnum, payload: any): Promise<boolean> {
    console.log('Loading', this.constructor.name);
    payload = CommonUtil.removeEmptyPayloadAttributes(payload);
    const apiResponse = await this.httpService.getRequest(url, null, payload, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.totalCountSubject.next(apiResponse.data.count);
        const tempList: ReferrerModel[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(ReferrerModel.fromJson(s));
        }
        this.dataSubject.next(tempList);
        return true;
      case ServerResponseEnum.WARNING:
        const tempReferrerList: ReferrerModel[] = [];
        this.totalCountSubject.next(tempReferrerList.length);
        this.dataSubject.next(tempReferrerList);
        this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
