import { PaymentRouteEnum, TaxCategoryEnum, TaxMode, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

export interface ITaxRuleLookup {
  franchiseId: number;
  referenceId: number;
  transactionType: TransactionType;
  /** Country of the rule: the supplier's own country (decision 1) */
  countryCode: string;
  /** Date the rule must be effective on (supply date) */
  onDate: Date;
}

export interface TaxInput {
  baseAmount: number; // price before discount
  discountAmount: number; // absolute discount (not %)
  franchiseId: number; // franchise id
  referenceId: number; // plan id or product id
  supplierCountryCode: string | null; // from the franchise address (ISO code)
  supplierStateCode?: string | null; // required for Indian GST
  customerCountryCode: string | null; // from the billing address (ISO code)
  customerStateCode?: string | null; // required for Indian GST when billing in India
  /** Goods: where they are delivered (place of supply); defaults to the billing address */
  deliveryCountryCode?: string | null;
  deliveryStateCode?: string | null;
  currency: string; // INR, USD, AED, etc.
  transactionType: TransactionType;
  /**
   * How the money arrives. Gateway records: derived from the currency when absent (non-INR can
   * only be paid from abroad). Manual records: chosen by the admin.
   */
  paymentRoute?: PaymentRouteEnum | null;
  /** Date of supply, for the LUT and rule validity (defaults to today) */
  supplyDate?: Date | string | null;
}

export interface TaxResult {
  baseAmount: number;
  discount: number;
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
  taxCategory?: TaxCategoryEnum | null;
  lutArn?: string | null;
  paymentRoute?: PaymentRouteEnum | null;
  taxDecisionReason?: string | null;
}
