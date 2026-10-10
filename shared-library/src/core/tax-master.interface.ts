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
  /** Computed for today: VALID, EXPIRING (≤ 30 days left), EXPIRED, FUTURE, INCOMPLETE (no dates), INACTIVE */
  status: FranchiseLutStatus;
}

export type FranchiseLutStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'FUTURE' | 'INCOMPLETE' | 'INACTIVE';

export interface IManageFranchiseLut {
  arn: string;
  financialYear: string;
  validFrom: string;
  validTo: string;
  active?: boolean;
}

/** An exchange rate: `rate` units of `toCurrency` for 1 unit of `fromCurrency`. */
export interface IExchangeRate {
  exchangeRateId: number;
  rateDate: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  validTo: string | null;
  note: string | null;
  active: boolean;
}

/** Finance entry: a MANUAL rate for one day, or a CBIC customs rate for its notified period. */
export interface IManageExchangeRate {
  rateDate: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: 'MANUAL' | 'CBIC_CUSTOMS';
  validTo?: string | null;
  note?: string | null;
}

/** FX saved on an invoice when it is issued (principle 1). */
export interface IInvoiceFx {
  fxRate?: number | null;
  fxRateDate?: string | null;
  fxSource?: string | null;
  /** INR for Indian franchises, AED for the UAE; null when the invoice is already in it */
  functionalCurrency?: string | null;
  functionalTotalAmount?: number | null;
  functionalTaxAmount?: number | null;
}

/** A Tax Credit Note against an issued invoice (roadmap 4.6, group 10). */
export interface ICreditNote extends IInvoiceFx {
  creditNoteId: number;
  franchiseId: number;
  memberId: number;
  memberPaymentId: number | null;
  memberProductId: number | null;
  originalInvoiceId: string;
  originalInvoiceDate: string | null;
  creditNoteNumber: string;
  creditNoteDate: string;
  eventDate: string;
  reason: string;
  currency: string;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxCategory: string | null;
  taxPercentage: number | null;
  /** Issued more than 14 days after the event (UAE deadline) */
  lateIssue: boolean;
}

export interface ICreateCreditNote {
  /** The invoiced record: a plan payment or a product order */
  recordType: 'plan' | 'product';
  recordId: number;
  /** Amount to credit, including VAT, in the invoice currency (≤ what is still creditable) */
  amount: number;
  reason: string;
  /** Date of the event that triggers the credit (refund agreed, service reduced, …) */
  eventDate: string;
}

