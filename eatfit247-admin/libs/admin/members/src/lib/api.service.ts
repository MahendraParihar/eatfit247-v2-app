import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IMember } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class MembersApiService extends ApiBaseService {
  private readonly endpoint = '/member';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IMember>> {
    return await this.httpService.get<ITableList<IMember>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IMember> {
    return await this.httpService.get<IMember>(`${this.endpoint}/manage/${id}`);
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, userStatusId: number, deactivationReason?: string): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, {
      userStatusId,
      deactivationReason,
    });
  }
}

