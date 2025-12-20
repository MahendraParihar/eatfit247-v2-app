import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IMember, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class MembersApiService extends ApiBaseService {
  private readonly endpoint = '/member';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IMember>> {
    const res = await this.httpService.get<IResponse<ITableList<IMember>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IMember>;
  }

  async getById(id: number): Promise<IMember> {
    const res = await this.httpService.get<IResponse<IMember>>(`${this.endpoint}/manage/${id}`);
    return res.data as IMember;
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

