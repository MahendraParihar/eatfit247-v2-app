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
  /** VAT category (STANDARD / ZERO_RATED / EXEMPT / OUT_OF_SCOPE) */
  taxCategory: string;
  effectiveFrom: Date | string;
  effectiveTo: Date | string | null;
  active: boolean;
  createdIp: string;
  modifiedIp: string;
}

/** A Letter of Undertaking filed by an Indian franchise for exports without IGST (roadmap 4.6). */
export interface IFranchiseLut {
  franchiseLutId: number;
  franchiseId: number;
  arn: string;
  /** Indian financial year, e.g. 2026-27 */
  financialYear: string;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
}

export interface IManageFranchiseLut {
  arn: string;
  financialYear: string;
  validFrom: string;
  validTo: string;
  active?: boolean;
}
