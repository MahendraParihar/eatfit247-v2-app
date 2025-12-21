import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IPressMedia, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PressMediaApiService extends ApiBaseService {
  private readonly endpoint = '/press-media';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IPressMedia>> {
    const res = await this.httpService.get<IResponse<ITableList<IPressMedia>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IPressMedia>;
  }

  async getById(id: number): Promise<IPressMedia> {
    const res = await this.httpService.get<IResponse<IPressMedia>>(`${this.endpoint}/manage/${id}`);
    return res.data as IPressMedia;
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
