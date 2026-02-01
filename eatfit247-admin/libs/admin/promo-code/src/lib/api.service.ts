import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IPromoCode, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PromoCodeApiService extends ApiBaseService {
  private readonly endpoint = '/promo-code';

  constructor() {
    super();
  }

  async getList(params?: any): Promise<ITableList<IPromoCode>> {
    const res = await this.httpService.get<ITableList<IPromoCode>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IPromoCode>;
  }

  async getById(id: number): Promise<IPromoCode> {
    const res = await this.httpService.get<IPromoCode>(`${this.endpoint}/manage/${id}`);
    return res.data as IPromoCode;
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
}

