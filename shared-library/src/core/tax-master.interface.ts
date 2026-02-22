import { IAdminInfo } from '../base.interface';

export interface ITaxMaster extends IAdminInfo {
  id: number;
  franchiseId: number;
  referenceId: number;
  countryCode: string;
  transactionType: string;
  taxSystem: string;
  taxCode: string;
  taxName: string;
  taxPercent: number;
  applyOn: string;
  isTaxInclusive: boolean;
  effectiveFrom: Date | string;
  effectiveTo: Date | string | null;
  active: boolean;
  createdIp: string;
  modifiedIp: string;
}


