import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IBanner, IResponse, IManageBanner } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class BannersApiService extends ApiBaseService {
  private readonly endpoint = '/banner';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IBanner>> {
    const res = await this.httpService.get<ITableList<IBanner>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IBanner>;
  }

  async getById(id: number): Promise<IBanner> {
    const res = await this.httpService.get<IBanner>(`${this.endpoint}/manage/${id}`);
    return res.data as IBanner;
  }

  async create(data: IManageBanner): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageBanner): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }
}

