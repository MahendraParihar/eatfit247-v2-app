import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { IFranchise, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FranchiseApiService extends ApiBaseService {
  private readonly endpoint = '/franchise';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IFranchise>> {
    const res = await this.httpService.get<ITableList<IFranchise>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IFranchise>;
  }

  async getById(id: number): Promise<IFranchise> {
    const res = await this.httpService.get<IFranchise>(`${this.endpoint}/manage/${id}`);
    return res.data as IFranchise;
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

  async getMasterData(): Promise<{ taxApplicable: boolean }> {
    const res = await this.httpService.get<{ taxApplicable: boolean }>(`${this.endpoint}/master-data`);
    return res.data as { taxApplicable: boolean };
  }
}
