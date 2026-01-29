import { TaxMode, TaxTypeEnum, InvoiceItemType } from '../../enum';

/**
 * Invoice Document - Canonical JSON structure for invoices
 * This is a pure data structure, immutable once generated
 * Used for PDF generation, UI preview, and email attachments
 */
export interface IInvoiceDocument {
  header: IInvoiceHeader;
  seller: IInvoiceParty;
  buyer: IInvoiceParty;
  items: IInvoiceItem[];
  pricing: IInvoicePricing;
  tax: IInvoiceTax;
  total: IInvoiceTotal;
  payment: IInvoicePayment;
  qrCode?: IInvoiceQrCode;
  footer: IInvoiceFooter;
}

export interface IInvoiceHeader {
  title: string; // e.g., "TAX INVOICE", "INVOICE"
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  dueDate?: string; // ISO date string (optional)
  currency: string; // ISO currency code (INR, USD, AED, etc.)
}

export interface IInvoiceParty {
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  country: string; // ISO country code
  taxId?: string; // GSTIN, VAT number, etc.
  taxIdLabel?: string; // "GSTIN", "VAT No.", etc.
  phone?: string;
  email?: string;
  logo?: string; // Logo URL for display in invoice header
}

export interface IInvoiceItem {
  type: InvoiceItemType; // SERVICE or PRODUCT
  description: string;
  sacCode?: string; // Service Accounting Code (for SERVICE items when GST)
  hsnCode?: string; // Harmonized System of Nomenclature (for PRODUCT items when GST)
  qty: number;
  rate: number; // Unit price
  amount: number; // qty * rate
  discount?: number; // Discount amount for this item
  taxAmount?: number; // Tax amount for this item
  totalAmount?: number; // Total for this item (amount - discount + tax)
}

export interface IInvoicePricing {
  subtotal: number; // Sum of all item amounts
  discount: number; // Total discount amount
  netAmount: number; // subtotal - discount
}

export interface IInvoiceTax {
  taxType: TaxTypeEnum; // GST, VAT, NONE, etc.
  taxMode: TaxMode; // DOMESTIC_GST, EXPORT_OF_SERVICE, VAT, RCM_IMPORT_SERVICE, NO_TAX
  rows: IInvoiceTaxRow[]; // Individual tax components (CGST, SGST, IGST, VAT, etc.)
  totalTax: number; // Sum of all tax rows
  note?: string; // Tax-related notes (e.g., LUT note, RCM note)
}

export interface IInvoiceTaxRow {
  label: string; // "CGST", "SGST", "IGST", "VAT", etc.
  amount: number;
  percentage?: number; // Optional percentage for display
  taxableAmount?: number; // Taxable amount (base amount - discount) for this tax row
}

export interface IInvoiceTotal {
  label: string; // "Total Amount", "Amount Payable", etc.
  amount: number; // netAmount + totalTax
}

export interface IInvoicePayment {
  methods: string[]; // Payment method names
  status: string; // Payment status
  transactionId?: string; // Optional transaction ID
}

export interface IInvoiceQrCode {
  enabled: boolean; // Only true for Indian GST domestic invoices
  value: string; // QR code data (JSON string or concatenated string)
  label: string; // Label to display below QR code
}

export interface IInvoiceFooter {
  legalNote?: string; // Legal disclaimer, terms, etc.
}

