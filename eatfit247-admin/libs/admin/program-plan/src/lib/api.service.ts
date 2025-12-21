import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IProgramPlan, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramPlanApiService extends ApiBaseService {
  private readonly endpoint = '/program-plan';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IProgramPlan>> {
    const res = await this.httpService.get<IResponse<ITableList<IProgramPlan>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IProgramPlan>;
  }

  async getById(id: number): Promise<IProgramPlan> {
    const res = await this.httpService.get<IResponse<IProgramPlan>>(`${this.endpoint}/manage/${id}`);
    return res.data as IProgramPlan;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getMasterData(): Promise<{ programPlanType: IDropdownItem[]; currencies: IDropdownItem[] }> {
    const res = await this.httpService.get<IResponse<{ programPlanType: IDropdownItem[]; currencies: IDropdownItem[] }>>(`${this.endpoint}/program-plan-master`);
    return res.data as { programPlanType: IDropdownItem[]; currencies: IDropdownItem[] };
  }
}
