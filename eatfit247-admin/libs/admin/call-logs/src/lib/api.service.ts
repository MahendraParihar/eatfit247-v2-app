import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IMemberCallLog } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class CallLogsApiService extends CrudApiService<IMemberCallLog> {
  constructor() {
    super('/call-log');
  }
}
