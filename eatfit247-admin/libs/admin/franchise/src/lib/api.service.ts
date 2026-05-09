import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IFranchise } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FranchiseApiService extends CrudApiService<IFranchise> {
  constructor() {
    super('/franchise');
  }

  async getMasterData(): Promise<{ taxApplicable: boolean }> {
    const res = await this.httpService.get<{ taxApplicable: boolean }>(`${this.endpoint}/master-data`);
    return res.data as { taxApplicable: boolean };
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    return this.getDropdown();
  }
}
