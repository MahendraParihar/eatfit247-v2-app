import { IBaseAdminUser } from '../base.interface';

export interface ITaxMaster {
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
  createdBy: number;
  modifiedBy: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdIp: string;
  modifiedIp: string;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}


