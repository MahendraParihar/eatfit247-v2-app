import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { IBlog, IDropdownItem, IResponse, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class BlogsApiService extends ApiBaseService {
  private readonly endpoint = '/blog';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IBlog>> {
    const res = await this.httpService.get<ITableList<IBlog>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IBlog>;
  }

  async getById(id: number): Promise<IBlog> {
    const res = await this.httpService.get<IBlog>(`${this.endpoint}/manage/${id}`);
    return res.data as IBlog;
  }

  async create(data: any): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getMasterData(): Promise<{ blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] }> {
    const res = await this.httpService.get<IResponse<{ blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] }>>(
      `${this.endpoint}/blog-master`
    );
    return res.data as { blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] };
  }
}

