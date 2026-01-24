import { TaxMode, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

export interface ITaxCalculationInput {
  franchiseId: number;
  referenceId: number;
  transactionType: TransactionType;
  buyerCountryCode: string;
}

export interface TaxInput {
  baseAmount: number; // price before discount
  discountAmount: number; // absolute discount (not %)
  franchiseId: number; // franchise id
  referenceId: number; // plan id or product id
  supplierCountryCode: string; // from entity address (ISO code)
  supplierStateCode?: string; // required for GST / US sales tax
  customerCountryCode: string; // from the customer address (ISO code)
  customerStateCode?: string; // required for GST / US sales tax
  currency: string; // INR, USD, AED, etc.
  transactionType: TransactionType;
}

export interface TaxResult {
  taxType: TaxTypeEnum;
  taxPercentage: number;
  taxAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  totalAmount: number;
  taxMode?: TaxMode;
  invoiceNote?: string;
  entityCountry: string;
  customerCountry: string;
  placeOfSupply: string;
  isLutApplied: boolean;
}

export interface CountryTaxInfo {
  taxType: TaxTypeEnum;
  defaultTaxPercentage: number | null;
}

export interface StateTaxInfo {
  taxPercentage: number;
}
