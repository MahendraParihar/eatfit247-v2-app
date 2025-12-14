import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IAdminUser, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class AdminUserApiService extends ApiBaseService {
  private readonly endpoint = '/admin-user';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IAdminUser>> {
    return await this.httpService.get<ITableList<IAdminUser>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IAdminUser> {
    return await this.httpService.get<IAdminUser>(`${this.endpoint}/manage/${id}`);
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, isActive: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { isActive });
  }

  async getDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/dropdown`);
  }
}

