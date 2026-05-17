import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IAdminUser, IDropdownItem, IManageAdminUser } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class AdminUserApiService extends CrudApiService<IAdminUser, IManageAdminUser> {
  constructor() {
    super('/admin-user');
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }

  async getRoleDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/role/dropdown`);
    return res.data as IDropdownItem[];
  }
}
