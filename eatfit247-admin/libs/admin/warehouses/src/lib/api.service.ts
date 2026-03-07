import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import {
  IDropdownItem,
  IManageWarehouse,
  ITableList,
  IWarehouse,
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class WarehousesApiService extends ApiBaseService {
  private readonly endpoint = '/warehouse';

  constructor() {
    super();
  }

  async getList(
    params?: Record<string, unknown>
  ): Promise<ITableList<IWarehouse>> {
    const res = await this.httpService.get<ITableList<IWarehouse>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IWarehouse>;
  }

  async getById(id: number): Promise<IWarehouse> {
    const res = await this.httpService.get<IWarehouse>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as IWarehouse;
  }

  async create(data: IManageWarehouse): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageWarehouse): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    await this.httpService.delete<void>(`${this.endpoint}/manage/${id}`);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, {
      active,
    });
  }

  async getDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.endpoint}/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('country/dropdown');
    return res.data as IDropdownItem[];
  }

  async getStateDropdown(countryId?: number): Promise<IDropdownItem[]> {
    const params = countryId ? { countryId } : {};
    const res = await this.httpService.get<IDropdownItem[]>('state/dropdown', {
      params,
    });
    return res.data as IDropdownItem[];
  }
}
