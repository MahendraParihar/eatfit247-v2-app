import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IReferrer } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ReferrerApiService extends ApiBaseService {
  private readonly endpoint = '/referrer';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IReferrer>> {
    return await this.httpService.get<ITableList<IReferrer>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IReferrer> {
    return await this.httpService.get<IReferrer>(`${this.endpoint}/manage/${id}`);
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
