import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ICourierProvider } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CourierProvidersApiService extends CrudApiService<ICourierProvider> {
  constructor() {
    super('/courier-provider');
  }
}
