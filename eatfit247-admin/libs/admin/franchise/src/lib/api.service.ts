import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IFranchise, IFranchiseLut, IManageFranchiseLut } from '@eatfit247-shared-lib';

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

  /** LUT register (roadmap 4.6) */
  async listLuts(franchiseId: number): Promise<IFranchiseLut[]> {
    const res = await this.httpService.get<IFranchiseLut[]>(`/franchise-luts/${franchiseId}`);
    return (res.data as IFranchiseLut[]) || [];
  }

  async createLut(franchiseId: number, data: IManageFranchiseLut): Promise<void> {
    await this.httpService.post<IFranchiseLut>(`/franchise-luts/${franchiseId}`, data);
  }

  async updateLut(franchiseId: number, lutId: number, data: IManageFranchiseLut): Promise<void> {
    await this.httpService.put<IFranchiseLut>(`/franchise-luts/${franchiseId}/${lutId}`, data);
  }

  async setLutStatus(franchiseId: number, lutId: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(`/franchise-luts/${franchiseId}/${lutId}/status`, { active });
  }
}
