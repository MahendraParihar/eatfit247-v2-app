import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IBlog, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class BlogsApiService extends ApiBaseService {
  private readonly endpoint = '/blog';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IBlog>> {
    return await this.httpService.get<ITableList<IBlog>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IBlog> {
    return await this.httpService.get<IBlog>(`${this.endpoint}/manage/${id}`);
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

  async getMasterData(): Promise<{ blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] }> {
    return await this.httpService.get<{ blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] }>(
      `${this.endpoint}/blog-master`
    );
  }
}

