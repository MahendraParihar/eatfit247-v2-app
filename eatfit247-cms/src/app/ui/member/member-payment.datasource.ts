import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpService} from "../../service/http.service";
import {ServerResponseEnum} from "../../enum/server-response-enum";
import {SnackBarService} from "../../service/snack-bar.service";
import {MemberPaymentModel} from "src/app/models/member-payment.model";

export class MemberPaymentDatasource implements DataSource<MemberPaymentModel> {

  private dataSubject = new BehaviorSubject<MemberPaymentModel[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<MemberPaymentModel[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(url: string, memberId: number): Promise<boolean> {
    const apiResponse = await this.httpService.getRequest(url, memberId, null, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.totalCountSubject.next(apiResponse.data.count);
        const tempList: MemberPaymentModel[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(MemberPaymentModel.fromJson(s));
        }
        this.dataSubject.next(tempList);
        return true;
      case ServerResponseEnum.WARNING:
        this.dataSubject.next([]);
        // this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
