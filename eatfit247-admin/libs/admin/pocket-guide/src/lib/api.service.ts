import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IPocketGuide, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PocketGuideApiService extends ApiBaseService {
  private readonly endpoint = '/pocket-guide';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IPocketGuide>> {
    const res = await this.httpService.get<ITableList<IPocketGuide>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IPocketGuide>;
  }

  async getById(id: number): Promise<IPocketGuide> {
    const res = await this.httpService.get<IPocketGuide>(`${this.endpoint}/manage/${id}`);
    return res.data as IPocketGuide;
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
