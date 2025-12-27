import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IResponse, IMemberCallLog } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CallLogsApiService extends ApiBaseService {
  private readonly endpoint = '/call-log';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IMemberCallLog>> {
    const res = await this.httpService.get<IResponse<ITableList<IMemberCallLog>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IMemberCallLog>;
  }

  async getById(id: number): Promise<IMemberCallLog> {
    const res = await this.httpService.get<IResponse<IMemberCallLog>>(`${this.endpoint}/manage/${id}`);
    return res.data as IMemberCallLog;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }
}
