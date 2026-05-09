import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IManageWarehouse, IWarehouse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class WarehousesApiService extends CrudApiService<IWarehouse, IManageWarehouse> {
  constructor() {
    super('/warehouse');
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('country/dropdown');
    return res.data as IDropdownItem[];
  }

  async getStateDropdown(countryId?: number): Promise<IDropdownItem[]> {
    const params = countryId ? { countryId } : {};
    const res = await this.httpService.get<IDropdownItem[]>('state/dropdown', { params });
    return res.data as IDropdownItem[];
  }
}
