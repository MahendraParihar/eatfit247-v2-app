import { inject } from '@angular/core';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { IDropdownItem, IMemberDietPlan } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';

export class MemberDietPlanDatasource implements DataSource<IMemberDietPlan> {
  private apiService = inject(MembersApiService);
  private dataSubject = new BehaviorSubject<IMemberDietPlan[]>([]);
  private dietTemplateSubject = new BehaviorSubject<IDropdownItem[]>([]);
  private expandedSubject = new BehaviorSubject<boolean[]>([]);
  private totalCountSubject = new BehaviorSubject<number>(0);
  
  totalCount = this.totalCountSubject.asObservable();
  dietTemplate = this.dietTemplateSubject.asObservable();
  expanded = this.expandedSubject.asObservable();
  data = this.dataSubject.asObservable();

  connect(collectionViewer: CollectionViewer): Observable<IMemberDietPlan[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
  }

  async loadData(memberId: number): Promise<boolean> {
    try {
      const apiResponse = await this.apiService.getDietPlans(memberId);
      this.totalCountSubject.next(apiResponse.count);
      const tempExpandedList: boolean[] = [];
      const tempList: IMemberDietPlan[] = apiResponse.list;
      this.dataSubject.next(tempList);
      this.expandedSubject.next(tempExpandedList);
      if (apiResponse.dietTemplateList) {
        const dietTemplateList: IDropdownItem[] = apiResponse.dietTemplateList;
        this.dietTemplateSubject.next(dietTemplateList);
      }
      return true;
    } catch (error) {
      // Error is handled by the calling component
      this.dataSubject.next([]);
      this.totalCountSubject.next(0);
      return false;
    }
  }
}

