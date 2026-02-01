import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IAdminUser, IDropdownItem, IManageAdminUser, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class AdminUserApiService extends ApiBaseService {
  private readonly endpoint = '/admin-user';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<IAdminUser>> {
    const res = await this.httpService.get<ITableList<IAdminUser>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IAdminUser>;
  }

  async getById(id: number): Promise<IAdminUser> {
    const res = await this.httpService.get<IAdminUser>(`${this.endpoint}/manage/${id}`);
    return res.data as IAdminUser;
  }

  async create(data: IManageAdminUser): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageAdminUser): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/dropdown`);
    return res.data as IDropdownItem[];
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }
}
