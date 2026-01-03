import { TaxMode, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

export interface TaxInput {
  baseAmount: number; // price before discount
  discountAmount: number; // absolute discount (not %)
  supplierCountryCode: string; // from entity address (ISO code)
  supplierStateCode?: string; // required for GST / US sales tax
  customerCountryCode: string; // from the customer address (ISO code)
  customerStateCode?: string; // required for GST / US sales tax
  currency: string; // INR, USD, AED, etc.
  transactionType: TransactionType;
  isTaxApplicable?: boolean; // default = true (used only for exemptions)
}

export interface TaxResult {
  taxType: TaxTypeEnum;
  taxPercentage: number;
  taxAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  totalAmount: number;
  taxMode?: TaxMode;
  invoiceNote?: string;
}

export interface CountryTaxInfo {
  taxType: TaxTypeEnum;
  defaultTaxPercentage: number | null;
}

export interface StateTaxInfo {
  taxPercentage: number;
}
