import { Injectable, inject } from '@angular/core';
import { CrudApiService, HttpService } from '@core';
import { IDropdownItem, IProgram } from '@eatfit247-shared-lib';

export interface ProgramPlanMasters {
  currencies: IDropdownItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ProgramsApiService extends CrudApiService<IProgram> {
  private http = inject(HttpService);

  constructor() {
    super('/program');
  }

  async getProgramPlanMasters(): Promise<ProgramPlanMasters> {
    const res = await this.http.get<ProgramPlanMasters>('/program-plan/program-plan-master');
    return res.data as ProgramPlanMasters;
  }
}
