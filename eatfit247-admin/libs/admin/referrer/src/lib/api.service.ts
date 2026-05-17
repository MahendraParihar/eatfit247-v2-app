import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IReferrer } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ReferrerApiService extends CrudApiService<IReferrer> {
  constructor() {
    super('/referrer');
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }
}
