import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IPressMedia, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PressMediaApiService extends ApiBaseService {
  private readonly endpoint = '/press-media';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<IPressMedia>> {
    const res = await this.httpService.get<ITableList<IPressMedia>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IPressMedia>;
  }

  async getById(id: number): Promise<IPressMedia> {
    const res = await this.httpService.get<IPressMedia>(`${this.endpoint}/manage/${id}`);
    return res.data as IPressMedia;
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
}
