import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { IDropdownItem, IProduct, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProductsApiService extends ApiBaseService {
  private readonly endpoint = '/product';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IProduct>> {
    const res = await this.httpService.get<ITableList<IProduct>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IProduct>;
  }

  async getById(id: number): Promise<IProduct> {
    const res = await this.httpService.get<IProduct>(`${this.endpoint}/manage/${id}`);
    return res.data as IProduct;
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

  async getMasterData(): Promise<{ currencies: IDropdownItem[] }> {
    const res = await this.httpService.get<{ currencies: IDropdownItem[] }>(`${this.endpoint}/product-master`);
    return res.data as { currencies: IDropdownItem[] };
  }
}

