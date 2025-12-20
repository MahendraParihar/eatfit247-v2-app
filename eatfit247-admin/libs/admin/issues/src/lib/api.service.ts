import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IResponse, IIssue } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class IssuesApiService extends ApiBaseService {
  private readonly endpoint = '/issue';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IIssue>> {
    const res = await this.httpService.get<IResponse<ITableList<IIssue>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IIssue>;
  }

  async getById(id: number): Promise<IIssue> {
    const res = await this.httpService.get<IResponse<IIssue>>(`${this.endpoint}/manage/${id}`);
    return res.data as IIssue;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }
}
