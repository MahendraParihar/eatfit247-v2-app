import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpService} from "../../service/http.service";
import {ServerResponseEnum} from "../../enum/server-response-enum";
import {SnackBarService} from "../../service/snack-bar.service";
import {MemberIssueModel} from "src/app/models/member-isssue.model";

export class MemberIssueDatasource implements DataSource<MemberIssueModel> {

  private dataSubject = new BehaviorSubject<MemberIssueModel[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<MemberIssueModel[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(url: string, memberId: number, payload: {}): Promise<boolean> {

    const apiResponse = await this.httpService.getRequest(url, memberId, payload, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.totalCountSubject.next(apiResponse.data.count);
        const tempList: MemberIssueModel[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(MemberIssueModel.fromJson(s));
        }
        this.dataSubject.next(tempList);
        return true;
      case ServerResponseEnum.WARNING:

        const tempIssueList: MemberIssueModel[] = [];
        this.totalCountSubject.next(tempIssueList.length);

        this.dataSubject.next(tempIssueList);
        this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
