import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import {
  ICourierProviderWarehouse,
  IDropdownItem,
  IManageCourierProviderWarehouse,
  ITableList,
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CourierProviderWarehousesApiService extends ApiBaseService {
  private readonly endpoint = '/courier-provider-warehouse';

  constructor() {
    super();
  }

  async getList(
    params?: Record<string, unknown>
  ): Promise<ITableList<ICourierProviderWarehouse>> {
    const res = await this.httpService.get<
      ITableList<ICourierProviderWarehouse>
    >(`${this.endpoint}/list`, {
      params,
    });
    return res.data as ITableList<ICourierProviderWarehouse>;
  }

  async getById(id: number): Promise<ICourierProviderWarehouse> {
    const res = await this.httpService.get<ICourierProviderWarehouse>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as ICourierProviderWarehouse;
  }

  async create(data: IManageCourierProviderWarehouse): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(
    id: number,
    data: IManageCourierProviderWarehouse
  ): Promise<void> {
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

  async getWarehouseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      '/warehouse/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async getCourierProviderDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      '/courier-provider/dropdown'
    );
    return res.data as IDropdownItem[];
  }
}
