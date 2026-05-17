import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ICountry, ITableList, ITaxMaster } from '@eatfit247-shared-lib';

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
}
