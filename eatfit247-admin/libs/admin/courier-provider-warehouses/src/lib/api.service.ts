import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ICourierProviderWarehouse, IDropdownItem, IManageCourierProviderWarehouse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CourierProviderWarehousesApiService extends CrudApiService<ICourierProviderWarehouse, IManageCourierProviderWarehouse> {
  constructor() {
    super('/courier-provider-warehouse');
  }

  async getWarehouseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/warehouse/dropdown');
    return res.data as IDropdownItem[];
  }

  async getCourierProviderDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/courier-provider/dropdown');
    return res.data as IDropdownItem[];
  }
}
