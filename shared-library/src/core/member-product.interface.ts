import { IBaseAdminUser } from '../base.interface';
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
  effectiveTaxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  taxObj?: any;
  taxType?: TaxTypeEnum;
  taxMode?: TaxMode;
  isLutApplied?: boolean;
  jurisdiction?: any;
  invoiceNote?: string;
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
  subTotalAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  roundingAdjustment?: number;
  currency?: string;
  paymentSource: PaymentSourceEnum;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentLink?: string;
}

export interface IManageMemberProduct extends IBasicMemberProduct {
  orderItems: IMemberProductOrderItemBasic[];
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

