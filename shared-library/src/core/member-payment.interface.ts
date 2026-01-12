import { IBaseAdminUser, IDropdownItem } from '../base.interface';
import { IAddress } from './location.interface';
import { PaymentSourceEnum } from '../enum';

export interface IBasicMemberPayment {
  memberId: number;
  paymentModeId: number;
  programPlanId: number;
  programId: number;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: Date;
  invoiceId?: string;
  paymentStatusId: number;
  promoCode?: string;
  isTaxApplicable: boolean;
  paymentObj: IMemberPaymentObject;
  refundObj?: object | null;
  paymentGatewayResponse?: object | null;
  gstNumber?: string;
  billingAddressId?: number | null;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentLink?: string;
}

export interface IMemberPayment extends IBasicMemberPayment {
  memberPaymentId: number;
  memberName: string;
  paymentMode: string;
  programPlan: string;
  program: string;
  address?: IAddress;
  paymentStatus: string;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxObject?: object;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  deletable: boolean;
  billingAddress?: IAddress;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IManageMemberPayment {
  memberPaymentId?: number;
  memberId: number;
  paymentModeId: number;
  programId: number;
  programPlanId: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  billingAddressId?: number;
  addressId?: number;
  transactionId?: string;
  paymentDate: Date;
  paymentStatusId: number;
  isTaxApplicable: boolean;
  taxPercentage: number;
  isPlanFeesIncludedTax: boolean;
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
}

export interface IPaymentReport {
  fromDate: Date;
  toDate: Date;
  gstOnly: boolean;
}

export interface IMemberPaymentMasterData {
  paymentMode: IDropdownItem[];
  program: IDropdownItem[];
  programPlan: IDropdownItem[];
  paymentStatus: IDropdownItem[];
  addresses: IAddress[];
  taxApplicable: boolean;
  paymentSource: IDropdownItem[];
}

export interface ICalculateTaxRequest {
  orderAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
  isPlanFeesIncludedTax: boolean;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
}

export interface ICalculateTaxResponse {
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  taxType?: string;
  taxMode?: string;
  invoiceNote?: string;
}

export interface IMemberPaymentEntity {
  currency: string;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
}

export interface IMemberPaymentObject {
  currency: string;
  pricing: {
    orderAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  };
  tax: {
    taxType?: string;
    taxMode?: string;
    taxPercentage: number;
    taxAmount: number;
    isTaxIncludedInPrice: boolean;
    isLutApplied: boolean;
    taxObj: Record<string, { amount: number; taxPercentage: number }>;
  };
  jurisdiction: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
  invoice: {
    note?: string;
  };
  calculationVersion: string;
}
