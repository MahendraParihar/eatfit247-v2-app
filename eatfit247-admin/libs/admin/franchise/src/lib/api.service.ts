import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import {
  IAddressMaster,
  IDropdownItem,
  IFranchise,
  IFranchiseInvoiceCounters,
  IFranchiseLut,
  IFranchiseTurnover,
  IManageFranchiseLut,
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class FranchiseApiService extends CrudApiService<IFranchise> {
  constructor() {
    super('/franchise');
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    return this.getDropdown();
  }

  /** FY turnover against the GST registration threshold (compliant invoice numbering, decision 12) */
  async getTurnover(franchiseId: number): Promise<IFranchiseTurnover> {
    const res = await this.httpService.get<IFranchiseTurnover>(`${this.endpoint}/${franchiseId}/turnover`);
    return res.data as IFranchiseTurnover;
  }

  /** Current FY invoice counters, for the number-format preview */
  async getInvoiceCounters(franchiseId: number): Promise<IFranchiseInvoiceCounters> {
    const res = await this.httpService.get<IFranchiseInvoiceCounters>(`${this.endpoint}/${franchiseId}/invoice-counters`);
    return res.data as IFranchiseInvoiceCounters;
  }

  /** Countries with their ISO code in `metadata.countryCode` */
  async getCountries(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IAddressMaster>('address/address-master');
    return (res.data as IAddressMaster)?.country || [];
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
