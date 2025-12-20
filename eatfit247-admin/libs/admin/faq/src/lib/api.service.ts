import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IFaq, IFaqCategory, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FaqApiService extends ApiBaseService {
  private readonly endpoint = '/faq';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IFaq>> {
    const res = await this.httpService.get<IResponse<ITableList<IFaq>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IFaq>;
  }

  async getById(id: number): Promise<IFaq> {
    const res = await this.httpService.get<IResponse<IFaq>>(`${this.endpoint}/manage/${id}`);
    return res.data as IFaq;
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

  // FAQ Category methods
  async getCategoryList(params?: any): Promise<ITableList<IFaqCategory>> {
    const res = await this.httpService.get<IResponse<ITableList<IFaqCategory>>>(`${this.endpoint}/category/list`, { params });
    return res.data as ITableList<IFaqCategory>;
  }

  async getCategoryById(id: number): Promise<IFaqCategory> {
    const res = await this.httpService.get<IResponse<IFaqCategory>>(`${this.endpoint}/category/manage/${id}`);
    return res.data as IFaqCategory;
  }

  async createCategory(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/category/manage`, data);
  }

  async updateCategory(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/category/manage/${id}`, data);
  }

  async updateCategoryStatus(id: number, isActive: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/category/update-status/${id}`, { isActive });
  }

  async getCategoryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(`${this.endpoint}/category/dropdown`);
    return res.data as IDropdownItem[];
  }
}
