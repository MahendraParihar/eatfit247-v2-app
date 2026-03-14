/**
 * Checkout-related interfaces for public member creation
 */
import {PaymentSourceEnum} from '../enum';

export interface ICheckoutMemberData {
  firstName: string;
  lastName: string;
  emailId: string;
  countryCode: string;
  contactNumber: string;
  countryId: number;
  referrerId?: number;
  nutritionistId?: number;
}

export interface ICheckoutMemberResponse {
  memberId: number;
  isNew: boolean;
  checkoutToken: string;
}

/**
 * Address data for checkout
 */
export interface ICheckoutAddressData {
  postalAddress: string;
  cityVillage?: string;
  stateId: number;
  countryId: number;
  pinCode?: string;
  addressName?: string;
}

/**
 * Tax calculation request for checkout
 */
export interface ITaxCalculationRequest {
  orderAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
  isPlanFeesIncludedTax: boolean;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
}

/**
 * Tax calculation response for checkout
 */
export interface ITaxCalculationResponse {
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  taxType?: string;
  taxMode?: string;
  invoiceNote?: string;
}

/**
 * Payment gateway information
 */
export interface IPaymentGateway {
  franchisePaymentGatewayId: number;
  gatewayCode: string;
  gatewayName: string;
  providerCountryCode: string;
  currencyCode: string;
  isPrimary: boolean;
  supportsDomestic: boolean;
  supportsInternational: boolean;
}

/**
 * Create a plan order request for checkout
 */
export interface ICreatePlanOrderRequest {
  paymentModeId?: number | null;
  billingAddressId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: string; // ISO date string
  paymentStatusId: number;
  programId?: number | null;
  programPlanId: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isTaxApplicable: boolean;
  taxPercentage: number;
  currencyCode: string;
  promoCode?: string;
  gstNumber?: string;
  paymentSource: PaymentSourceEnum;
  orderAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentLink?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentGatewayResponse?: Record<string, any>;
  recaptchaToken?: string; // reCAPTCHA v3 token (required by backend)
}

