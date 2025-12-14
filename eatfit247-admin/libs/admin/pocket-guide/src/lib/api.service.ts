import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IPocketGuide } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PocketGuideApiService extends ApiBaseService {
  private readonly endpoint = '/pocket-guide';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IPocketGuide>> {
    return await this.httpService.get<ITableList<IPocketGuide>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IPocketGuide> {
    return await this.httpService.get<IPocketGuide>(`${this.endpoint}/manage/${id}`);
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
