import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';
import { IManageAddress } from './location.interface';
import { BusinessTypeEnum, TurnoverAlertLevel } from '../enum';

export interface IBaseFranchise {
  franchiseCode: string;
  financialYear: number;
  companyName: string;
  logo?: IMediaUpload[];
  firstName: string;
  lastName: string;
  emailId: string;
  alternateEmailId: string;
  contactNumber: string;
  alternateContactNumber: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  vatNumber?: string;
  bankAccountId?: string;
  paymentGatewayConfigId?: number;
  brandName?: string;
  lutNumber?: string;
  internationalTaxMode?: string;
  /** IANA zone for invoice dates (e.g. Asia/Kolkata, Asia/Dubai) */
  timeZone?: string;
  /** Invoice number prefix, 1–5 of [A-Z0-9]; used by `invoiceNumberFormat` */
  invoicePrefix?: string | null;
  /** Invoice number template (`{PREFIX}/{FY}/{TYPE}/{SEQ5}`); null = legacy format */
  invoiceNumberFormat?: string | null;
  /** GST registration threshold (INR) for the turnover warning; applies while there is no GSTIN */
  registrationThresholdAmount?: number | null;
  /** Working (functional) currency, ISO 4217 (configurable tax treatment, decision 17) */
  currencyCode?: string | null;
  startDate: Date;
  endDate?: Date;
  isPrimary: boolean;
  isDefault: boolean;
  businessType?: BusinessTypeEnum[];
  addressObj?: IManageAddress;
}

export interface IManageFranchise extends IBaseFranchise {
  franchiseId?: number;
  active: boolean;
}

export interface IFranchise extends IBaseFranchise, IAdminInfo {
  franchiseId: number;
  active: boolean;
}


/** Financial-year turnover of a franchise against its registration threshold. */
export interface IFranchiseTurnover {
  /** e.g. `2026-27`, or `2026` for a January FY */
  financialYear: string;
  /** Sum of issued plan payments and product orders in the FY (functional currency, else invoice amount) */
  turnover: number;
  threshold: number | null;
  /** turnover / threshold × 100, rounded to 2 decimals; null without a threshold */
  percent: number | null;
  level: TurnoverAlertLevel;
  /** Invoices in another currency still waiting for an exchange rate; not in `turnover` */
  fxPendingCount: number;
}

/** One invoice counter of a franchise for a financial year (`mst_invoice_sequences`). */
export interface IFranchiseInvoiceCounter {
  /** `service`, `product` or `credit` */
  invoiceType: string;
  /** `DOMESTIC` or `EXPORT` */
  series: string;
  /** Last number issued; the next one is currentNumber + 1 */
  currentNumber: number;
}

/** The franchise's counters for its current financial year, for the number-format preview. */
export interface IFranchiseInvoiceCounters {
  financialYear: string;
  /** Today in the franchise's timezone, `YYYY-MM-DD` */
  invoiceDate: string;
  counters: IFranchiseInvoiceCounter[];
}
