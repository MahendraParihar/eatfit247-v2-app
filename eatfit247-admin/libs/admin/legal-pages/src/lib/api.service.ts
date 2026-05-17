import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ILegalPageList, IManageLegalPage } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class LegalPagesApiService extends CrudApiService<ILegalPageList, IManageLegalPage> {
  constructor() {
    super('/legal-page');
  }
}
