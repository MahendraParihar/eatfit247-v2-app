import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpService} from "../../service/http.service";
import {SnackBarService} from "../../service/snack-bar.service";
import {ApiUrlEnum} from "../../enum/api-url-enum";
import {ServerResponseEnum} from "../../enum/server-response-enum";
import {FranchiseModel} from "../../models/franchise.model";
import {CommonUtil} from "src/app/utilites/common-util";

export class FranchiseDatasource implements DataSource<FranchiseModel> {

  private dataSubject = new BehaviorSubject<FranchiseModel[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<FranchiseModel[]> {
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
        const tempList: FranchiseModel[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(FranchiseModel.fromJson(s));
        }
        this.dataSubject.next(tempList);
        return true;

      case ServerResponseEnum.WARNING:
        const tempFranchiseList: FranchiseModel[] = [];
        this.totalCountSubject.next(tempFranchiseList.length);
        this.dataSubject.next(tempFranchiseList);
        this.snackBarService.showWarning(apiResponse.message);
        return false;

      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
