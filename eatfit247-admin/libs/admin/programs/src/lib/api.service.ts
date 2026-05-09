import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IProgram } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class ProgramsApiService extends CrudApiService<IProgram> {
  constructor() {
    super('/program');
  }

  async getMasterData(): Promise<{ programCategory: IDropdownItem[] }> {
    const res = await this.httpService.get<{ programCategory: IDropdownItem[] }>(`${this.endpoint}/program-master`);
    return res.data as { programCategory: IDropdownItem[] };
  }
}
