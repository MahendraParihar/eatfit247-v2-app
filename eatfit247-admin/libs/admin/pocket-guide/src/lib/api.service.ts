import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IPocketGuide } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class PocketGuideApiService extends CrudApiService<IPocketGuide> {
  constructor() {
    super('/pocket-guide');
  }
}
