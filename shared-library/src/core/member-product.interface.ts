import { IBaseAdminUser, IAdminInfo } from '../base.interface';
import { IAddress } from './location.interface';
import { PaymentSourceEnum, TaxMode, TaxTypeEnum } from '../enum';

export interface IMemberProductOrderItemBasic {
  productId: number;
  productVariantId: number;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
}

export interface IMemberProductOrderItem {
  memberProductOrderItemId: number;
  memberProductId: number;
  productId: number;
  productVariantId: number;
  productName: string;
  quantityLabel: string;
  quantity: number;
  unitPrice: number;
  baseAmount: number;
  discountAmount?: number;
  effectiveTaxRate: number;
  taxAmount: number;
  hsnCode?: string;
  totalAmount: number;
  taxObj?: Record<string, { amount: number; taxPercentage: number }>;
  taxType: TaxTypeEnum;
  taxMode: TaxMode;
  isLutApplied?: boolean;
  jurisdiction?: any;
  invoiceNote?: string;
}

export interface IBasicMemberProduct {
  memberId: number;
  paymentModeId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: Date;
  invoiceId?: string;
  paymentStatusId: number;
  franchiseId?: number | null;
  promoCode?: string;
  refundObj?: object | null;
  paymentGatewayResponse?: object | null;
  gstNumber?: string;
  billingAddressId?: number | null;
  memberAddress?: any;
  subTotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  roundingAdjustment?: number;
  currency: string;
  paymentSource: PaymentSourceEnum;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentLink?: string;
}

export interface IManageMemberProduct {
  memberProductId?: number;
  paymentModeId?: number;
  billingAddressId: number;
  addressId?: number;
  transactionId?: string;
  paymentDate: Date;
  paymentStatusId: number;
  currencyCode: string;
  promoCode?: string;
  gstNumber?: string;
  paymentSource: PaymentSourceEnum;
  paymentGatewayResponse?: object;
  discountAmount: number;
  paymentLink?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  orderItems: IMemberProductOrderItemBasic[];
}

export interface IMemberProduct extends IBasicMemberProduct, IAdminInfo {
  memberProductId: number;
  memberName: string;
  paymentMode?: string;
  paymentStatus: string;
  address?: IAddress;
  billingAddress?: IAddress;
  franchise?: string;
  orderItems: IMemberProductOrderItem[];
}

