import { TaxTypeEnum } from 'eatfit247-shared-lib';

export interface TaxInput {
  baseAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
  supplierCountryCode: string;
  supplierStateCode?: string | null;
  customerCountryCode: string;
  customerStateCode?: string | null;
}

export interface TaxResult {
  taxType: TaxTypeEnum;
  taxPercentage: number;
  taxAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  totalAmount: number;
}

export interface CountryTaxInfo {
  taxType: TaxTypeEnum;
  defaultTaxPercentage: number | null;
}

export interface StateTaxInfo {
  taxPercentage: number;
}
