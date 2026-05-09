import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IProduct } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProductsApiService extends CrudApiService<IProduct> {
  constructor() {
    super('/product');
  }

  async getMasterData(): Promise<{ currencies: IDropdownItem[] }> {
    const res = await this.httpService.get<{ currencies: IDropdownItem[] }>(`${this.endpoint}/product-master`);
    return res.data as { currencies: IDropdownItem[] };
  }
}
