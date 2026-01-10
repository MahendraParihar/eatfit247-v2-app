import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, ISuccessStory, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class SuccessStoriesApiService extends ApiBaseService {
  private readonly endpoint = '/success-story';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<ISuccessStory>> {
    const res = await this.httpService.get<IResponse<ITableList<ISuccessStory>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<ISuccessStory>;
  }

  async getById(id: number): Promise<ISuccessStory> {
    const res = await this.httpService.get<IResponse<ISuccessStory>>(`${this.endpoint}/manage/${id}`);
    return res.data as ISuccessStory;
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
}

