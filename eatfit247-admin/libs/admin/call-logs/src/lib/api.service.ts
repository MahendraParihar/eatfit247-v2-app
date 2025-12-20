import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IResponse, ICallLog } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CallLogsApiService extends ApiBaseService {
  private readonly endpoint = '/call-log';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<ICallLog>> {
    const res = await this.httpService.get<IResponse<ITableList<ICallLog>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<ICallLog>;
  }

  async getById(id: number): Promise<ICallLog> {
    const res = await this.httpService.get<IResponse<ICallLog>>(`${this.endpoint}/manage/${id}`);
    return res.data as ICallLog;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }
}
