import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IDropdownItem, IFaq, IFaqCategory, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FaqApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/faq';

  async getList(params?: any): Promise<ITableList<IFaq>> {
    const res = await this.httpService.get<ITableList<IFaq>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IFaq>;
  }

  async getById(id: number): Promise<IFaq> {
    const res = await this.httpService.get<IFaq>(`${this.endpoint}/manage/${id}`);
    return res.data as IFaq;
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

  // FAQ Category methods
  async getCategoryList(params?: any): Promise<ITableList<IFaqCategory>> {
    const res = await this.httpService.get<ITableList<IFaqCategory>>(`${this.endpoint}/category/list`, { params });
    return res.data as ITableList<IFaqCategory>;
  }

  async getCategoryById(id: number): Promise<IFaqCategory> {
    const res = await this.httpService.get<IFaqCategory>(`${this.endpoint}/category/manage/${id}`);
    return res.data as IFaqCategory;
  }

  async createCategory(data: any): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/category/manage`, data);
  }

  async updateCategory(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/category/manage/${id}`, data);
  }

  async updateCategoryStatus(id: number, isActive: boolean): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/category/update-status/${id}`, { isActive });
  }

  async getCategoryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`${this.endpoint}/category/dropdown`);
    return res.data as IDropdownItem[];
  }

  async getMasterData(): Promise<{ faqCategory: IDropdownItem[] }> {
    const res = await this.httpService.get<{ faqCategory: IDropdownItem[]}>(`${this.endpoint}/faq-master`);
    return res.data as { faqCategory: IDropdownItem[] };
  }
}
