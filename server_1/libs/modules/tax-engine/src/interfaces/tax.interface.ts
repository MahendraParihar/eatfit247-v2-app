import { CustomerTypeEnum, PaymentRouteEnum, TaxCategoryEnum, TaxMode, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

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
  /**
   * The customer's GSTIN / TRN (payment / order `gst_number`, decision 10). Valid for the billing country → B2B
   * (and for India services the GSTIN's State is the place of supply); otherwise the sale is B2C.
   */
  customerRegistrationNumber?: string | null;
  /** Refuse an invalid number (400) instead of pricing B2C: on create, and on update when the number changed */
  enforceCustomerRegistration?: boolean;
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
  /** ISO country of the place of supply (delivery country for goods, billing country for services) */
  placeOfSupplyCountryCode?: string | null;
  /** State code of the place of supply for domestic supplies; null for exports */
  placeOfSupplyStateCode?: string | null;
  /** HSN / SAC of the rule that priced the line */
  hsnSacCode?: string | null;
  /** The Tax Master rule that priced the line (configurable tax treatment, decision 13) */
  taxMasterId?: number | null;
  /** The franchise's registration the sale is invoiced under; null = unregistered */
  taxRegistrationId?: number | null;
  /** B2B with a valid customer GSTIN / TRN for the billing country, else B2C (decision 10) */
  customerType?: CustomerTypeEnum | null;
  /** The country of the customer's number (IN for a GSTIN, AE for a TRN); null for B2C */
  customerRegistrationCountry?: string | null;
  /** The customer's number as validated (upper case, no spaces); null for B2C */
  customerRegistrationNumber?: string | null;
  /** The rule has an evidence policy (decision 9) */
  requiresEvidence?: boolean;
}
