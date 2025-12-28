import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IAdminUser, IDropdownItem, IResponse, IManageAdminUser } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class AdminUserApiService extends ApiBaseService {
  private readonly endpoint = '/admin-user';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IAdminUser>> {
    const res = await this.httpService.get<IResponse<ITableList<IAdminUser>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IAdminUser>;
  }

  async getById(id: number): Promise<IAdminUser> {
    const res = await this.httpService.get<IResponse<IAdminUser>>(`${this.endpoint}/manage/${id}`);
    return res.data as IAdminUser;
  }

  async create(data: IManageAdminUser): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageAdminUser): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(`${this.endpoint}/dropdown`);
    return res.data as IDropdownItem[];
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }
}
