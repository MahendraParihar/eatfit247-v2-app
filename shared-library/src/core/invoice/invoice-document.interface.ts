import { TaxMode, TaxTypeEnum, InvoiceItemType } from '../../enum';

/**
 * Invoice Document - Canonical JSON structure for invoices
 * This is a pure data structure, immutable once generated
 * Used for PDF generation, UI preview, and email attachments
 */
export interface InvoiceDocument {
  header: InvoiceHeader;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  items: InvoiceItem[];
  pricing: InvoicePricing;
  tax: InvoiceTax;
  total: InvoiceTotal;
  payment: InvoicePayment;
  qrCode?: InvoiceQrCode;
  footer: InvoiceFooter;
}

export interface InvoiceHeader {
  title: string; // e.g., "TAX INVOICE", "INVOICE"
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  dueDate?: string; // ISO date string (optional)
  currency: string; // ISO currency code (INR, USD, AED, etc.)
}

export interface InvoiceParty {
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
}

export interface InvoiceItem {
  type: InvoiceItemType; // SERVICE or PRODUCT
  description: string;
  sacCode?: string; // Service Accounting Code (for SERVICE items when GST)
  hsnCode?: string; // Harmonized System of Nomenclature (for PRODUCT items when GST)
  qty: number;
  rate: number; // Unit price
  amount: number; // qty * rate
}

export interface InvoicePricing {
  subtotal: number; // Sum of all item amounts
  discount: number; // Total discount amount
  netAmount: number; // subtotal - discount
}

export interface InvoiceTax {
  taxType: TaxTypeEnum; // GST, VAT, NONE, etc.
  taxMode: TaxMode; // DOMESTIC_GST, EXPORT_OF_SERVICE, VAT, RCM_IMPORT_SERVICE, NO_TAX
  rows: InvoiceTaxRow[]; // Individual tax components (CGST, SGST, IGST, VAT, etc.)
  totalTax: number; // Sum of all tax rows
  note?: string; // Tax-related notes (e.g., LUT note, RCM note)
}

export interface InvoiceTaxRow {
  label: string; // "CGST", "SGST", "IGST", "VAT", etc.
  amount: number;
  percentage?: number; // Optional percentage for display
}

export interface InvoiceTotal {
  label: string; // "Total Amount", "Amount Payable", etc.
  amount: number; // netAmount + totalTax
}

export interface InvoicePayment {
  methods: string[]; // Payment method names
  status: string; // Payment status
}

export interface InvoiceQrCode {
  enabled: boolean; // Only true for Indian GST domestic invoices
  value: string; // QR code data (JSON string or concatenated string)
  label: string; // Label to display below QR code
}

export interface InvoiceFooter {
  legalNote?: string; // Legal disclaimer, terms, etc.
}

