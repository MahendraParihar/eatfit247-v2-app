import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IManageSeoPage, ISeoPage, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class SeoPageApiService extends ApiBaseService {
  private readonly endpoint = '/seo-page';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<ISeoPage>> {
    const res = await this.httpService.get<ISeoPage[]>(`${this.endpoint}/list`, { params });
    const data = res.data as ISeoPage[];
    // Convert array response to ITableList format
    return {
      tableData: data || [],
      count: data?.length || 0
    };
  }

  async getById(id: number): Promise<ISeoPage> {
    const res = await this.httpService.get<ISeoPage>(`${this.endpoint}/manage/${id}`);
    return res.data as ISeoPage;
  }

  async create(data: IManageSeoPage): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageSeoPage): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }
}

