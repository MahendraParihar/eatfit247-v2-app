import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IIssue } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class IssuesApiService extends CrudApiService<IIssue> {
  constructor() {
    super('/issue');
  }
}
