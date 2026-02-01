import { TaxMode, TaxTypeEnum } from '../enum';

export interface ICalculateTaxRequest {
  orderAmount: number;
  discountAmount: number;
  currency: string;
}

export interface ICalculateTaxResponse {
  taxPercentage: number;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  taxType: TaxTypeEnum;
  taxMode: TaxMode;
  invoiceNote?: string;
  currency: string;
  isLutApplied: boolean;
  jurisdiction: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
}

export interface ICalculatePlanTaxRequest {
  orderAmount: number;
  discountAmount: number;
  currency: string;
}