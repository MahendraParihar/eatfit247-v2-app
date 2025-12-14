import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IPressMedia } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PressMediaApiService extends ApiBaseService {
  private readonly endpoint = '/press-media';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IPressMedia>> {
    return await this.httpService.get<ITableList<IPressMedia>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IPressMedia> {
    return await this.httpService.get<IPressMedia>(`${this.endpoint}/manage/${id}`);
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
