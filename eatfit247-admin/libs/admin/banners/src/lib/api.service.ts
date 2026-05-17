import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IBanner, IManageBanner } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class BannersApiService extends CrudApiService<IBanner, IManageBanner> {
  constructor() {
    super('/banner');
  }
}
