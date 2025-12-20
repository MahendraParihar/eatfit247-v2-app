import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IReferrer, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ReferrerApiService extends ApiBaseService {
  private readonly endpoint = '/referrer';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IReferrer>> {
    const res = await this.httpService.get<IResponse<ITableList<IReferrer>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IReferrer>;
  }

  async getById(id: number): Promise<IReferrer> {
    const res = await this.httpService.get<IResponse<IReferrer>>(`${this.endpoint}/manage/${id}`);
    return res.data as IReferrer;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, isActive: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { isActive });
  }
}
