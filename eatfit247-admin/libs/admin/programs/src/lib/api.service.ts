import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IProgram, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramsApiService extends ApiBaseService {
  private readonly endpoint = '/program';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IProgram>> {
    const res = await this.httpService.get<IResponse<ITableList<IProgram>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IProgram>;
  }

  async getById(id: number): Promise<IProgram> {
    const res = await this.httpService.get<IResponse<IProgram>>(`${this.endpoint}/manage/${id}`);
    return res.data as IProgram;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getMasterData(): Promise<{ programCategory: IDropdownItem[] }> {
    const res = await this.httpService.get<IResponse<{ programCategory: IDropdownItem[] }>>(`${this.endpoint}/program-master`);
    return res.data as { programCategory: IDropdownItem[] };
  }
}
