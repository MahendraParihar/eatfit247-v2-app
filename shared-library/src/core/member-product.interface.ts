import { IBaseAdminUser } from '../base.interface';
import { IAddress } from './location.interface';
import { PaymentSourceEnum } from '../enum';

export interface IBasicMemberProduct {
  memberId: number;
  paymentModeId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: Date;
  invoiceId?: string;
  paymentStatusId: number;
  promoCode?: string;
  isTaxApplicable: boolean;
  paymentObj: object;
  refundObj?: object | null;
  paymentGatewayResponse?: object | null;
  gstNumber?: string;
  billingAddressId?: number | null;
  paymentSource: PaymentSourceEnum;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentLink?: string;
}

export interface IMemberProduct extends IBasicMemberProduct {
  memberProductId: number;
  memberName: string;
  paymentMode?: string;
  paymentStatus?: string;
  address?: IAddress;
  billingAddress?: IAddress;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

