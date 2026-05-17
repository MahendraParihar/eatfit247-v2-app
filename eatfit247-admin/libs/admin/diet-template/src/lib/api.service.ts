import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IDietPlanDetail, IDietTemplate, IDropdownItem, IManageDietTemplate, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class DietTemplateApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/diet-template';

  async getList(params?: any): Promise<ITableList<IDietTemplate>> {
    const res = await this.httpService.get<ITableList<IDietTemplate>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IDietTemplate>;
  }

  async getById(id: number): Promise<IDietTemplate> {
    const res = await this.httpService.get<IDietTemplate>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as IDietTemplate;
  }

  async getDietTemplateDetail(
    dietTemplateId: number,
    cycleNo: number,
    dayNo?: number,
    params?: any
  ): Promise<{
    recipes: IDropdownItem[];
    diet: {
      dietTemplateId: number;
      dietTemplate: string;
      cycleNo: number;
      dayNo?: number;
      noOfCycle: number;
      noOfDaysInCycle: number;
      dietPlan: IDietPlanDetail[];
    };
  }> {
    let url = `${this.endpoint}/manage/${dietTemplateId}/${cycleNo}`;
    if (dayNo) {
      url = `${url}/${dayNo}`;
    }
    const res = await this.httpService.get<{
      recipes: IDropdownItem[];
      diet: {
        dietTemplateId: number;
        dietTemplate: string;
        cycleNo: number;
        dayNo?: number;
        noOfCycle: number;
        noOfDaysInCycle: number;
        dietPlan: IDietPlanDetail[];
      };
    }>(url, { params });
    return res.data as {
      recipes: IDropdownItem[];
      diet: {
        dietTemplateId: number;
        dietTemplate: string;
        cycleNo: number;
        dayNo?: number;
        noOfCycle: number;
        noOfDaysInCycle: number;
        dietPlan: IDietPlanDetail[];
      };
    };
  }

  async create(data: IManageDietTemplate): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageDietTemplate): Promise<void> {
    await this.httpService.put<void>(
      `${this.endpoint}/manage/${id}`,
      data
    );
  }

  async createDietTemplateDetail(
    dietTemplateId: number,
    data: {
      cycleNo: number;
      dayNo?: number;
      dietTemplateId: number;
      dietPlan: IDietPlanDetail[];
    }
  ): Promise<void> {
    await this.httpService.post<void>(
      `${this.endpoint}/manage-detail/${dietTemplateId}`,
      data
    );
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.endpoint}/update-status/${id}`,
      { active }
    );
  }

  async deleteCycleDetail(dietTemplateId: number, cycleNo: number): Promise<void> {
    await this.httpService.delete<void>(
      `${this.endpoint}/manage-detail/${dietTemplateId}/${cycleNo}`
    );
  }

  async deleteDayDetail(dietTemplateId: number, cycleNo: number, dayNo: number): Promise<void> {
    await this.httpService.delete<void>(
      `${this.endpoint}/manage-detail/${dietTemplateId}/${cycleNo}/${dayNo}`
    );
  }

  async getProgramDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/program/dropdown');
    return (res.data as IDropdownItem[]) || [];
  }
}
