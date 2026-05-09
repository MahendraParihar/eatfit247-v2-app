import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IPromoCode } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PromoCodeApiService extends CrudApiService<IPromoCode> {
  constructor() {
    super('/promo-code');
  }
}
