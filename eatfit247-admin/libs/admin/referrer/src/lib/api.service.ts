import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { IDropdownItem, IReferrer, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class ReferrerApiService extends ApiBaseService {
  private readonly endpoint = '/referrer';
  private readonly franchiseEndpoint = '/franchise';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IReferrer>> {
    const res = await this.httpService.get<ITableList<IReferrer>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IReferrer>;
  }

  async getById(id: number): Promise<IReferrer> {
    const res = await this.httpService.get<IReferrer>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as IReferrer;
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

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`${this.franchiseEndpoint}/dropdown`);
    return res.data as IDropdownItem[];
  }
}
