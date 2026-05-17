import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ICourierProviderAccount, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CourierProviderAccountsApiService extends CrudApiService<ICourierProviderAccount> {
  constructor() {
    super('/courier-provider-account');
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
