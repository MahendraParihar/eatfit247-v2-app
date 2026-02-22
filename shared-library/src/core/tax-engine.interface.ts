import { TaxTypeEnum } from '../enum';

export interface ITaxInput {
  supplierCountryCode: string;
  supplierStateCode?: string | null;
  supplierTaxNumber?: string | null;
  customerCountryCode: string;
  customerStateCode?: string | null;
  baseAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
}

export interface ITaxResult {
  taxType: TaxTypeEnum;
  taxPercentage: number;
  taxAmount: number;
  taxObj: Record<string, any>;
  totalAmount: number;
}