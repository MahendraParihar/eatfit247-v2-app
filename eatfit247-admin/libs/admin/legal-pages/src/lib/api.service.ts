import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ILegalPageList, IManageLegalPage, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class LegalPagesApiService extends ApiBaseService {
  private readonly endpoint = '/legal-page';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<ILegalPageList>> {
    const res = await this.httpService.get<ITableList<ILegalPageList>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<ILegalPageList>;
  }

  async getById(id: number): Promise<ILegalPageList> {
    const res = await this.httpService.get<ILegalPageList>(`${this.endpoint}/manage/${id}`);
    return res.data as ILegalPageList;
  }

  async create(data: IManageLegalPage): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageLegalPage): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }
}

