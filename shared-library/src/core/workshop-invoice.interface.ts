import { IAdminInfo, IDropdownItem } from '../base.interface';
import { TaxMode, TaxTypeEnum } from '../enum';
import { IAddressBasic } from './location.interface';
import { ITableListFilter } from './table-list.interface';

/**
 * Bill-to address snapshot stored on the workshop invoice (IAddress shape without an addressId).
 * postalAddress = line 1, addressName = line 2 (same mapping the invoice PDF uses).
 */
export interface IWorkshopInvoiceAddress extends IAddressBasic {
  state: string;
  stateCode?: string;
  country: string;
  countryCode?: string;
}

/**
 * Fields that can't change once an invoice number is issued (decision 8).
 */
export const WORKSHOP_INVOICE_LOCKED_FIELDS = [
  'franchiseId',
  'quantity',
  'unitRate',
  'description',
  'currency',
  'billToCountryId',
  'billToStateId',
  'placeOfSupplyStateId',
  'invoiceDate',
  'supplyDate',
] as const;

export type WorkshopInvoiceLockedField = (typeof WORKSHOP_INVOICE_LOCKED_FIELDS)[number];

export interface IWorkshopInvoiceTaxRequest {
  franchiseId: number;
  billToCountryId: number;
  billToStateId: number;
  /** Defaults to billToStateId (decision 6). */
  placeOfSupplyStateId?: number | null;
  quantity: number;
  unitRate: number;
  currency: string;
}

export interface IManageWorkshopInvoice extends IWorkshopInvoiceTaxRequest {
  /** YYYY-MM-DD, franchise-local. Defaults to today on the form. */
  invoiceDate: string;
  /** YYYY-MM-DD, the workshop date printed as "Date of Supply". */
  supplyDate: string;
  billToName: string;
  billToContactPerson?: string | null;
  billToEmail?: string | null;
  billToPhone?: string | null;
  billToGstin?: string | null;
  billToAddressLine1: string;
  billToAddressLine2?: string | null;
  billToCity: string;
  billToPinCode: string;
  description: string;
  paymentStatusId: number;
  paymentModeId?: number | null;
  transactionId?: string | null;
  /** YYYY-MM-DD */
  paymentDate?: string | null;
  notes?: string | null;
  /** Set after the admin confirms an invoice date earlier than the series' latest (decision 4). */
  confirmBackdate?: boolean;
}

export interface ICancelWorkshopInvoice {
  cancelReason: string;
}

export interface IWorkshopInvoiceSearch extends ITableListFilter {
  franchiseId?: number | null;
  /** YYYY-MM-DD */
  invoiceDateFrom?: string | null;
  /** YYYY-MM-DD */
  invoiceDateTo?: string | null;
  paymentStatusId?: number | null;
  /** Cancelled (inactive) invoices are listed unless this is false. */
  includeCancelled?: boolean | null;
}

export interface IWorkshopInvoiceMasterData {
  franchise: IDropdownItem[];
  paymentStatus: IDropdownItem[];
  paymentMode: IDropdownItem[];
  country: IDropdownItem[];
  currency: IDropdownItem[];
}

export interface IWorkshopInvoice extends IAdminInfo {
  workshopInvoiceId: number;
  franchiseId: number;
  franchise: string;
  franchiseCode: string;
  invoiceId: string | null;
  invoiceDate: string;
  supplyDate: string;
  billToName: string;
  billToContactPerson: string | null;
  billToEmail: string | null;
  billToPhone: string | null;
  billToGstin: string | null;
  billToAddress: IWorkshopInvoiceAddress;
  billToCountryId: number;
  billToStateId: number;
  placeOfSupplyStateId: number;
  placeOfSupplyState: string;
  description: string;
  sacCode: string | null;
  quantity: number;
  unitRate: number;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  taxType: TaxTypeEnum;
  taxMode: TaxMode;
  taxPercentage: number;
  isLutApplied: boolean;
  jurisdiction: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  } | null;
  paymentStatusId: number;
  paymentStatus: string;
  paymentModeId: number | null;
  paymentMode: string;
  transactionId: string | null;
  paymentDate: string | null;
  notes: string | null;
  cancelReason: string | null;
  active: boolean;
  /** True once an invoice number is issued: the money fields are locked (decision 8). */
  locked: boolean;
}
