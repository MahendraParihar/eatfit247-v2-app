import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../../service/http.service';
import { ServerResponseEnum } from '../../enum/server-response-enum';
import { SnackBarService } from '../../service/snack-bar.service';
import { MemberCallLogModel } from '../../models/member-call-log.model';

export class MemberCallLogDatasource implements DataSource<MemberCallLogModel> {
  private dataSubject = new BehaviorSubject<MemberCallLogModel[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<MemberCallLogModel[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(url: string, memberId: number, payload: {}): Promise<boolean> {
    console.log('Loading', this.constructor.name);
    const apiResponse = await this.httpService.getRequest(url, memberId, payload, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.totalCountSubject.next(apiResponse.data.count);
        const tempList: MemberCallLogModel[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(MemberCallLogModel.fromJson(s));
        }
        this.dataSubject.next(tempList);
        return true;
      case ServerResponseEnum.WARNING:
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
