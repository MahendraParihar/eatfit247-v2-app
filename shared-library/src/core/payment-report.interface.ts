import { IMemberPayment } from './member';
import { ITableList } from './table-list.interface';
import { IFinancialYearOption } from './dashboard-report.interface';
import { IDropdownItem } from '../base.interface';
import { TaxMode, TaxTypeEnum } from '../enum';

/** Which side of the transaction the country filter matches. */
export type PaymentReportCountrySource = 'member' | 'billing';

/** Inclusion mode for the country multi-select. */
export type PaymentReportCountryMode = 'in' | 'notIn';

/** Quarter of the *financial* year, relative to the franchise FY start month. */
export type FinancialQuarter = 1 | 2 | 3 | 4;

export interface IPaymentReportFilter {
  /** yyyy-MM-dd. Always the authoritative date predicate. */
  startDate: string;
  endDate: string;

  /** 0-based page index. */
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  /**
   * Echoed back for labelling and export filenames only.
   * The server never re-derives dates from these — startDate/endDate win.
   */
  fyStartYear?: number;
  fyQuarter?: FinancialQuarter;

  franchiseId?: number;

  /** Free text over first+last name, email and contact number. */
  memberSearch?: string;

  countryIds?: number[];
  countryMode?: PaymentReportCountryMode;
  countrySource?: PaymentReportCountrySource;

  minTotalAmount?: number;
  maxTotalAmount?: number;

  taxTypes?: TaxTypeEnum[];
  taxModes?: TaxMode[];
  isTaxApplicable?: boolean;
}

/**
 * Amounts are only summable within a single currency — payments are stored
 * in INR/USD/AED and a cross-currency SUM would be meaningless.
 */
export interface IPaymentReportCurrencyTotal {
  currency: string;
  recordCount: number;
  orderAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface IPaymentReportTotals {
  /** Rows across the entire filtered set, not just the current page. */
  recordCount: number;
  byCurrency: IPaymentReportCurrencyTotal[];
}

export interface IPaymentReportItem extends IMemberPayment {
  franchiseName?: string;
  /** Member's registered country — what `countrySource: 'member'` filters on. */
  memberCountry?: string;
  /** Country on the payment's billing address — what `countrySource: 'billing'` filters on. */
  billingCountry?: string;
}

/** Response envelope: extends ITableList so existing tableData/count callers keep working. */
export interface IPaymentReportResult extends ITableList<IPaymentReportItem> {
  totals: IPaymentReportTotals;
}

export interface IFinancialQuarterOption {
  quarter: FinancialQuarter;
  /** e.g. "Q1 (Apr - Jun)" */
  label: string;
  /** yyyy-MM-dd */
  startDate: string;
  endDate: string;
}

/** One round-trip bootstrap for the report filter bar. */
export interface IPaymentReportContext {
  /** Franchise whose FY calendar the UI should use. */
  franchiseId: number;
  companyName: string;
  /** 1 = Jan-Dec calendar year, 4 = Apr-Mar Indian FY. */
  fyStartMonth: number;
  availableYears: IFinancialYearOption[];
  /** Only the franchises this admin is allowed to query. */
  franchises: IDropdownItem[];
  countries: IDropdownItem[];
}
