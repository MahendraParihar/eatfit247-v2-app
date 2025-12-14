import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IFaq, IFaqCategory, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FaqApiService extends ApiBaseService {
  private readonly endpoint = '/faq';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IFaq>> {
    return await this.httpService.get<ITableList<IFaq>>(`${this.endpoint}/list`, { params });
  }

  async getById(id: number): Promise<IFaq> {
    return await this.httpService.get<IFaq>(`${this.endpoint}/manage/${id}`);
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
    return await this.httpService.get<ITableList<IFaqCategory>>(`${this.endpoint}/category/list`, { params });
  }

  async getCategoryById(id: number): Promise<IFaqCategory> {
    return await this.httpService.get<IFaqCategory>(`${this.endpoint}/category/manage/${id}`);
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
    return await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/category/dropdown`);
  }
}
