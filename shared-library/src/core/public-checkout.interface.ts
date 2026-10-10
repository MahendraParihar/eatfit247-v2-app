/**
 * Public (website) checkout contract for order-first payment.
 *
 * The client sends only what the customer chooses. Money state (status, source,
 * date, amounts, discount, transaction and gateway ids) is owned by the server,
 * and the public DTOs implementing these interfaces reject anything else.
 * reCAPTCHA travels in the `X-Recaptcha-Token` header, not the body.
 */
import { PaymentGatewayEnum, PaymentStatusEnum, TaxMode, TaxTypeEnum } from '../enum';
import { IPaymentLinkCustomer } from './payment-gateway.interface';
import { ICalculateTaxResponse } from './tax-calculation.interface';
import { ICalculateProductVariantTaxResponse } from './member/member-product.interface';

/** `POST checkout/plan/member/:memberId/order` */
export interface IPublicPlanOrderRequest {
  programPlanId: number;
  currency: string;
  addressId: number;
  billingAddressId: number;
  gstNumber?: string;
  promoCode?: string;
  franchisePaymentGatewayId?: number;
}

export interface IPublicProductOrderItem {
  productId: number;
  productVariantId: number;
  quantity: number;
}

/** `POST checkout/member/:memberId/product/order` */
export interface IPublicProductOrderRequest {
  items: IPublicProductOrderItem[];
  currency: string;
  addressId: number;
  billingAddressId: number;
  gstNumber?: string;
  promoCode?: string;
  franchisePaymentGatewayId?: number;
}

/** One priced product line, from master prices and per-line tax. */
export interface IPublicCheckoutPricedLine {
  productId: number;
  productVariantId: number;
  quantity: number;
  unitPrice: number;
  orderAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
}

/** Server-computed price of the PENDING record, in major units of `currency`. */
export interface IPublicCheckoutPricedBreakdown {
  currency: string;
  orderAmount: number;
  promoCode: string | null;
  discountAmount: number;
  taxableAmount: number;
  /** Plan orders only; product orders carry a percentage per line. */
  taxPercentage?: number;
  taxAmount: number;
  totalAmount: number;
  taxType?: TaxTypeEnum;
  taxMode?: TaxMode;
  taxObj?: Record<string, { amount: number; taxPercentage: number }>;
  /** Product orders only. */
  items?: IPublicCheckoutPricedLine[];
}

/** What the website needs to open the gateway's checkout for the stored total. */
export interface IPublicCheckoutGatewayPayload {
  gatewayCode: PaymentGatewayEnum;
  gatewayOrderId: string;
  /** Publishable key for the gateway SDK (never the secret). */
  keyId: string;
  /** Stored total in major units. */
  amount: number;
  /** Stored total in the gateway's minor units (see CurrencyUtil). */
  amountMinor: number;
  currency: string;
  customer: IPaymentLinkCustomer;
  notes: Record<string, string>;
}

/** Response of both public `…/order` endpoints. */
export interface IPublicCheckoutOrderResponse {
  /** `memberPaymentId` for plans, `memberProductId` for products. */
  recordId: number;
  paymentStatusId: PaymentStatusEnum;
  breakdown: IPublicCheckoutPricedBreakdown;
  gateway: IPublicCheckoutGatewayPayload;
}

/**
 * `POST checkout/plan/member/:memberId/calculate-tax` (public).
 * The promo code is validated and applied on the server; the client never sends a discount.
 * Admin keeps using `IPlanTaxCalculationRequest`.
 */
export interface IPublicPlanTaxCalculationRequest {
  programPlanId: number;
  currency: string;
  addressId?: number;
  billingAddressId?: number;
  promoCode?: string;
}

/** `discountAmount` (inherited) is the server-applied promo discount, 0 when none. */
export interface IPublicPlanTaxCalculationResponse extends ICalculateTaxResponse {
  promoCode: string | null;
  promoMessage?: string;
}

/**
 * `POST checkout/member/:memberId/calculate-tax` (public product checkout).
 * Admin keeps using `ICalculateProductVariantTaxRequest`.
 */
export interface IPublicProductTaxCalculationRequest {
  items: IPublicProductOrderItem[];
  currency: string;
  addressId?: number;
  billingAddressId?: number;
  promoCode?: string;
}

export interface IPublicProductTaxCalculationResponse extends ICalculateProductVariantTaxResponse {
  promoCode: string | null;
  promoMessage?: string;
}

/** `POST …/verify-payment` (plan and product): the gateway's checkout callback values. */
export interface IPublicVerifyPaymentRequest {
  /** Gateway order id returned by `…/order`. */
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface IPublicVerifyPaymentResponse {
  /** True once the record is PAID (by this call or an earlier webhook). */
  verified: boolean;
  recordId: number;
  paymentStatusId: PaymentStatusEnum;
  invoiceId: string | null;
  /** Gateway payment status when not verified, e.g. `authorized`, `failed`. */
  gatewayStatus?: string;
  message?: string;
}
