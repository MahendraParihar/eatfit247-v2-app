import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { ISuccessStory, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class SuccessStoriesApiService extends ApiBaseService {
  private readonly endpoint = '/success-story';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<ISuccessStory>> {
    const res = await this.httpService.get<ITableList<ISuccessStory>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<ISuccessStory>;
  }

  async getById(id: number): Promise<ISuccessStory> {
    const res = await this.httpService.get<ISuccessStory>(`${this.endpoint}/manage/${id}`);
    return res.data as ISuccessStory;
  }

  async create(data: any): Promise<void> {
    await this.httpService.post(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    await this.httpService.put(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch(`${this.endpoint}/update-status/${id}`, { active });
  }
}

