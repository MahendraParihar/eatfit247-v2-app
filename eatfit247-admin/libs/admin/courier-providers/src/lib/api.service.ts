import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { ICourierProvider, IDropdownItem, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CourierProvidersApiService extends ApiBaseService {
  private readonly endpoint = '/courier-provider';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<ICourierProvider>> {
    const res = await this.httpService.get<ITableList<ICourierProvider>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<ICourierProvider>;
  }

  async getById(id: number): Promise<ICourierProvider> {
    const res = await this.httpService.get<ICourierProvider>(`${this.endpoint}/manage/${id}`);
    return res.data as ICourierProvider;
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

  async getDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/dropdown`);
    return res.data as IDropdownItem[];
  }
}

