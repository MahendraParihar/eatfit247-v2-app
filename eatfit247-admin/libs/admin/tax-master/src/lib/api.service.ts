import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { IBasicSearch, ICountry, ITableList, ITaxMaster } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class TaxMasterApiService extends ApiBaseService {
  private readonly endpoint = '/tax-master';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: IBasicSearch): Promise<ITableList<ITaxMaster>> {
    const res = await this.httpService.get<ITableList<ITaxMaster>>(`${this.endpoint}/list`, {
      params,
    });
    return res.data as ITableList<ITaxMaster>;
  }

  async getById(id: number): Promise<ITaxMaster> {
    const res = await this.httpService.get<ITaxMaster>(`${this.endpoint}/manage/${id}`);
    return res.data as ITaxMaster;
  }

  async create(data: Partial<ITaxMaster>): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: Partial<ITaxMaster>): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getCountryListWithCodes(): Promise<ICountry[]> {
    const res = await this.httpService.get<ITableList<ICountry>>('/country/list', {
      params: { limit: 1000, page: 0 },
    });
    return res.data?.tableData || [];
  }
}


