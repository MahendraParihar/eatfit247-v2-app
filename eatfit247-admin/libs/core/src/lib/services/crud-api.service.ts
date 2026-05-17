import { inject } from '@angular/core';
import { HttpService } from './http.service';
import { IDropdownItem, ITableList } from '@eatfit247-shared-lib';

/**
 * Generic CRUD API Service
 *
 * Base service for standard CRUD operations against a REST endpoint.
 * Subclass with your entity type and endpoint:
 *
 * @example
 * @Injectable({ providedIn: 'root' })
 * export class BannersApiService extends CrudApiService<IBanner, IManageBanner> {
 *   constructor() { super('/banner'); }
 * }
 */
export class CrudApiService<T, TManage = unknown> {
  protected httpService = inject(HttpService);

  constructor(protected readonly endpoint: string) {}

  async getList(params?: any): Promise<ITableList<T>> {
    const res = await this.httpService.get<ITableList<T>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<T>;
  }

  async getById(id: number): Promise<T> {
    const res = await this.httpService.get<T>(`${this.endpoint}/manage/${id}`);
    return res.data as T;
  }

  async create(data: TManage): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: TManage): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async delete(id: number): Promise<void> {
    await this.httpService.delete<void>(`${this.endpoint}/manage/${id}`);
  }

  async getDropdown(params?: any): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/dropdown`, { params });
    return res.data as IDropdownItem[];
  }
}
