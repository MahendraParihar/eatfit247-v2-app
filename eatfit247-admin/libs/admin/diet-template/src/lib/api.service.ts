import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IDietTemplate, IResponse, IManageDietTemplate } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class DietTemplateApiService extends ApiBaseService {
  private readonly endpoint = '/diet-template';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IDietTemplate>> {
    const res = await this.httpService.get<IResponse<ITableList<IDietTemplate>>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IDietTemplate>;
  }

  async getById(id: number): Promise<IDietTemplate> {
    const res = await this.httpService.get<IResponse<IDietTemplate>>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as IDietTemplate;
  }

  async create(data: IManageDietTemplate): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageDietTemplate): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/manage/${id}`,
      data
    );
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(
      `${this.endpoint}/update-status/${id}`,
      { active }
    );
  }
}
