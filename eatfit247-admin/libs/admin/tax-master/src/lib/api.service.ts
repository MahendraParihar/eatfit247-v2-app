import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ICountry, IExchangeRate, IManageExchangeRate, ITableList, ITaxMaster } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class TaxMasterApiService extends CrudApiService<ITaxMaster> {
  constructor() {
    super('/tax-master');
  }

  async getCountryListWithCodes(): Promise<ICountry[]> {
    const res = await this.httpService.get<ITableList<ICountry>>('/country/list', {
      params: { limit: 1000, page: 0 },
    });
    return res.data?.tableData || [];
  }

  /** Exchange rates (roadmap 4.6): official fetched rates plus Finance entries */
  async listExchangeRates(params: { fromCurrency?: string; toCurrency?: string; limit?: number } = {}): Promise<IExchangeRate[]> {
    const res = await this.httpService.get<IExchangeRate[]>('/exchange-rates', { params });
    return (res.data as IExchangeRate[]) || [];
  }

  async createExchangeRate(data: IManageExchangeRate): Promise<void> {
    await this.httpService.post<IExchangeRate>('/exchange-rates', data);
  }

  async setExchangeRateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`/exchange-rates/${id}/status`, { active });
  }
}
