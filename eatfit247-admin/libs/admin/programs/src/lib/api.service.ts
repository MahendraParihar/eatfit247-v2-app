import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IProgram } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramsApiService extends CrudApiService<IProgram> {
  constructor() {
    super('/program');
  }
}
