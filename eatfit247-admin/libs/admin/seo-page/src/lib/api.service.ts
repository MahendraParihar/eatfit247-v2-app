import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IManageSeoPage, ISeoPage } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class SeoPageApiService extends CrudApiService<ISeoPage, IManageSeoPage> {
  constructor() {
    super('/seo-page');
  }
}
