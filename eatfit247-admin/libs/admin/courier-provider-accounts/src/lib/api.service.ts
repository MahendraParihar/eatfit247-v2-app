import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { ICourierProviderAccount, IDropdownItem, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CourierProviderAccountsApiService extends ApiBaseService {
  private readonly endpoint = '/courier-provider-account';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<ICourierProviderAccount>> {
    const res = await this.httpService.get<ITableList<ICourierProviderAccount>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<ICourierProviderAccount>;
  }

  async getById(id: number): Promise<ICourierProviderAccount> {
    const res = await this.httpService.get<ICourierProviderAccount>(`${this.endpoint}/manage/${id}`);
    return res.data as ICourierProviderAccount;
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

  async getCourierProviderDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/courier-provider/dropdown');
    return res.data as IDropdownItem[];
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }
}

