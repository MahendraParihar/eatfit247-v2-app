import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../../service/http.service';
import { SnackBarService } from '../../service/snack-bar.service';
import { IDropdownItem } from 'shared-lib';

export class MemberDietPlanDatasource implements DataSource<any> {
  private dataSubject = new BehaviorSubject<any[]>([]);
  private dietTemplateSubject = new BehaviorSubject<IDropdownItem[]>([]);
  private expandedSubject = new BehaviorSubject<boolean[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  totalCount = this.totalCountSubject.asObservable();
  dietTemplate = this.dietTemplateSubject.asObservable();
  expanded = this.expandedSubject.asObservable();
  data = this.dataSubject.asObservable();

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService) {
  }

  connect(collectionViewer: CollectionViewer): Observable<any[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(url: string, memberId: number): Promise<boolean> {
    const apiResponse: any = await this.httpService.getRequest(url, memberId, null, true);
    this.totalCountSubject.next(apiResponse.data.count);
    const tempExpandedList: boolean[] = [];
    const tempList: any[] = apiResponse.data.list;
    this.dataSubject.next(tempList);
    this.expandedSubject.next(tempExpandedList);
    if (apiResponse.data.dietTemplateList) {
      const dietTemplateList: IDropdownItem[] = apiResponse.data.dietTemplateList;
      this.dietTemplateSubject.next(dietTemplateList);
    }
    return true;
  }
}
