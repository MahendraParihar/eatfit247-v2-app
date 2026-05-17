import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IPressMedia } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PressMediaApiService extends CrudApiService<IPressMedia> {
  constructor() {
    super('/press-media');
  }
}
