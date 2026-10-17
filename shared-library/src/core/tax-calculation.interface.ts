import { PaymentRouteEnum, TaxCategoryEnum, TaxMode, TaxTypeEnum } from '../enum';

export interface ICalculateTaxRequest {
  orderAmount: number;
  discountAmount: number;
  currency: string;
}

export interface ICalculateTaxResponse {
  taxPercentage: number;
  orderAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  taxType: TaxTypeEnum;
  taxMode: TaxMode;
  invoiceNote?: string;
  currency: string;
  isLutApplied: boolean;
  /** VAT category (UAE); null for GST and no-tax results */
  taxCategory?: TaxCategoryEnum | null;
  /** LUT ARN applied to a 0% export */
  lutArn?: string | null;
  /** Payment route the decision used (services by Indian franchises) */
  paymentRoute?: PaymentRouteEnum | null;
  /** Short, human-readable reason for the tax treatment, shown in admin and stored on the payment */
  taxDecisionReason?: string | null;
  jurisdiction: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
  /** ISO country of the place of supply, stored with the decision (Circular 242/36/2024) */
  placeOfSupplyCountryCode?: string | null;
  /** State code of the place of supply (GST state code for India); null for exports */
  placeOfSupplyStateCode?: string | null;
  /** HSN / SAC of the rule that priced this line */
  hsnSacCode?: string | null;
}

export interface ICalculatePlanTaxRequest {
  orderAmount: number;
  discountAmount: number;
  currency: string;
}