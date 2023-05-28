import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { AdminUserModel } from '../../models/admin-user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../../service/http.service';
import { ServerResponseEnum } from '../../enum/server-response-enum';
import { SnackBarService } from '../../service/snack-bar.service';
import { ApiUrlEnum } from '../../enum/api-url-enum';

export class AdminUserDatasource implements DataSource<AdminUserModel> {
  private dataSubject = new BehaviorSubject<AdminUserModel[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<AdminUserModel[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(payload: {}): Promise<boolean> {
    console.log('Loading', this.constructor.name);
    const apiResponse = await this.httpService.getRequest(ApiUrlEnum.ADMIN_LIST, null, payload, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.totalCountSubject.next(apiResponse.data.count);
        const tempList: AdminUserModel[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(AdminUserModel.fromJson(s));
        }
        this.dataSubject.next(tempList);
        return true;
      case ServerResponseEnum.WARNING:
        const tempUserList: AdminUserModel[] = [];
        this.totalCountSubject.next(tempUserList.length);
        this.dataSubject.next(tempUserList);
        this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
