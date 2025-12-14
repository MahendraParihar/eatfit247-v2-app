import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IProgram, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramsApiService extends ApiBaseService {
  private readonly endpoint = '/program';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IProgram>> {
    return await this.httpService.get<ITableList<IProgram>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IProgram> {
    return await this.httpService.get<IProgram>(`${this.endpoint}/manage/${id}`);
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, isActive: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active: isActive });
  }
}
