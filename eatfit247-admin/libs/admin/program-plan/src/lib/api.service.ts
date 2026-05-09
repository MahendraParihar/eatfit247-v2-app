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

  async getMasterData(): Promise<{ programPlanType: IDropdownItem[]; currencies: IDropdownItem[] }> {
    const res = await this.httpService.get<{ programPlanType: IDropdownItem[]; currencies: IDropdownItem[] }>(`${this.endpoint}/program-plan-master`);
    return res.data as { programPlanType: IDropdownItem[]; currencies: IDropdownItem[] };
  }
}
