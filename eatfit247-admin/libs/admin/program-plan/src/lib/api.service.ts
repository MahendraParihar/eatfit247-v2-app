import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IDropdownItem, IProgramPlan, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramPlanApiService extends ApiBaseService {
  private readonly endpoint = '/program-plan';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<IProgramPlan>> {
    const res = await this.httpService.get<ITableList<IProgramPlan>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IProgramPlan>;
  }

  async getById(id: number): Promise<IProgramPlan> {
    const res = await this.httpService.get<IProgramPlan>(`${this.endpoint}/manage/${id}`);
    return res.data as IProgramPlan;
  }

  async create(data: any): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getMasterData(): Promise<{ programPlanType: IDropdownItem[]; currencies: IDropdownItem[] }> {
    const res = await this.httpService.get<{ programPlanType: IDropdownItem[]; currencies: IDropdownItem[] }>(`${this.endpoint}/program-plan-master`);
    return res.data as { programPlanType: IDropdownItem[]; currencies: IDropdownItem[] };
  }
}
