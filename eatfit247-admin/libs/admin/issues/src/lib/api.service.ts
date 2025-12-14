import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class IssuesApiService extends ApiBaseService {
  private readonly endpoint = '/issue';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.endpoint}/manage/${id}`);
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }
}
