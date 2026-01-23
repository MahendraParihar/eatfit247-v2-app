import { IBaseAdminUser } from '../base.interface';
import { IAddress } from './location.interface';
import { PaymentSourceEnum, TaxMode, TaxTypeEnum } from '../enum';

export interface IOrderItem {
  productId: number;
  productUnit: string;
  productQuantity: number;
  perQuantityAmount: number;
  orderQuantity: number;
  totalAmount: number;
}

export interface IMemberProductOrderItem {
  memberProductOrderItemId: number;
  memberProductId: number;
  productId?: number;
  productVariantId?: number;
  productName?: string;
  quantityLabel?: string;
  unitPrice?: number;
  taxAmount?: number;
  taxPercent?: number;
  totalPrice?: number;
  taxObj?: any;
}

export interface IBasicMemberProduct {
  memberId: number;
  paymentModeId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate?: Date | null;
  invoiceId?: string;
  paymentStatusId: number;
  franchiseId?: number | null;
  promoCode?: string;
  refundObj?: object | null;
  paymentGatewayResponse?: object | null;
  gstNumber?: string;
  billingAddressId?: number | null;
  memberAddress?: any;
  orderAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  discountAmount?: number;
  currency?: string;
  currencyCode?: string;
  taxType?: TaxTypeEnum;
  taxMode?: TaxMode;
  taxPercentage?: number;
  isLutApplied?: boolean;
  isTaxIncluded?: boolean;
  isTaxApplicable?: boolean;
  isPlanFeesIncludedTax?: boolean;
  jurisdiction?: any;
  invoiceNote?: string;
  paymentSource: PaymentSourceEnum;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentLink?: string;
}

export interface IMemberProduct extends IBasicMemberProduct {
  memberProductId: number;
  memberName?: string;
  paymentMode?: string;
  paymentStatus?: string;
  address?: IAddress;
  billingAddress?: IAddress;
  franchise?: string;
  orderItems?: IMemberProductOrderItem[];
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

