import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IProgramPlan } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramPlanApiService extends CrudApiService<IProgramPlan> {
  constructor() {
    super('/program-plan');
  }

  async getMasterData(): Promise<{ currencies: IDropdownItem[] }> {
    const res = await this.httpService.get<{ currencies: IDropdownItem[] }>(`${this.endpoint}/program-plan-master`);
    return res.data as { currencies: IDropdownItem[] };
  }
}
