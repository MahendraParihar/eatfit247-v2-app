import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../../service/http.service';
import { ServerResponseEnum } from '../../enum/server-response-enum';
import { SnackBarService } from '../../service/snack-bar.service';
import { MemberDietPlanModel } from '../../models/member-diet-plan.model';
import { DropdownItem } from '../../interfaces/dropdown-item';

export class MemberDietPlanDatasource implements DataSource<MemberDietPlanModel> {

  private dataSubject = new BehaviorSubject<MemberDietPlanModel[]>([]);
  private dietTemplateSubject = new BehaviorSubject<DropdownItem[]>([]);
  private expandedSubject = new BehaviorSubject<boolean[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();
  dietTemplate = this.dietTemplateSubject.asObservable();
  expanded = this.expandedSubject.asObservable();
  data = this.dataSubject.asObservable();

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<MemberDietPlanModel[]> {
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
        const tempList: MemberDietPlanModel[] = [];
        const tempExpandedList: boolean[] = [];
        for (let s of apiResponse.data.list) {
          tempList.push(MemberDietPlanModel.fromJson(s));
          tempExpandedList.push(false);
        }
        this.dataSubject.next(tempList);
        this.expandedSubject.next(tempExpandedList);
        if (apiResponse.data.dietTemplateList) {
          const dietTemplateList: DropdownItem[] = [];
          for (const s of apiResponse.data.dietTemplateList) {
            dietTemplateList.push(DropdownItem.fromJson(s));
          }
          this.dietTemplateSubject.next(dietTemplateList);
        }
        return true;
      case ServerResponseEnum.WARNING:
        this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
