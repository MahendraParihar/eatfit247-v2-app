import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IFranchise, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FranchiseApiService extends ApiBaseService {
  private readonly endpoint = '/franchise';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IFranchise>> {
    return await this.httpService.get<ITableList<IFranchise>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IFranchise> {
    return await this.httpService.get<IFranchise>(`${this.endpoint}/manage/${id}`);
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

  async getDropdown(): Promise<{ franchise: IDropdownItem[] }> {
    return await this.httpService.get<{ franchise: IDropdownItem[] }>(`${this.endpoint}/dropdown`);
  }
}
