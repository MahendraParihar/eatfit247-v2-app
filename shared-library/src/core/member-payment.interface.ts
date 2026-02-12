import { IBaseAdminUser, IDropdownItem, IAdminInfo } from '../base.interface';
import { IAddress, IMemberAddress } from './location.interface';
import { PaymentSourceEnum, TaxMode, TaxTypeEnum } from '../enum';
import { IProduct } from './product.interface';
import { IMemberProductOrderItemBasic } from './member-product.interface';

export interface IMemberAddressSnapshot {
  address: IMemberAddress | null;
  billingAddress: IMemberAddress | null;
}

export interface IBasicMemberPayment {
  memberId: number;
  paymentModeId: number;
  programPlanId: number;
  programId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: Date;
  invoiceId?: string;
  paymentStatusId: number;
  promoCode?: string;
  refundObj?: object | null;
  paymentGatewayResponse?: object | null;
  gstNumber?: string;
  billingAddressId?: number | null;
  paymentSource: PaymentSourceEnum;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentLink?: string;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  isTaxApplicable: boolean;
  taxPercentage: number;
  currency: string;
  taxType: TaxTypeEnum;
  taxMode: TaxMode;
  isLutApplied: boolean;
  taxObj?: Record<string, { amount: number; taxPercentage: number }>;
  jurisdiction?: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
  invoiceNote?: string;
}

export interface IMemberPayment extends IBasicMemberPayment, IAdminInfo {
  memberPaymentId: number;
  memberName: string;
  paymentMode: string;
  programPlan: string;
  program: string;
  address?: IAddress;
  paymentStatus: string;
  memberAddress: IMemberAddressSnapshot;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  deletable: boolean;
  billingAddress?: IAddress;
}

export interface IManageMemberPayment {
  memberPaymentId?: number;
  memberId: number;
  paymentModeId: number;
  programId?: number | null;
  programPlanId: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  billingAddressId?: number;
  addressId?: number;
  transactionId?: string;
  paymentDate: Date;
  paymentStatusId: number;
  promoCode?: string;
  gstNumber?: string;
  paymentSource: PaymentSourceEnum;
  paymentLink?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentGatewayResponse?: object | null;
  discountAmount: number;
  currency?: string;
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

export interface IPlanTaxCalculationRequest {
  programPlanId: number;
  discountAmount: number;
  currency: string;
  addressId?: number;
  billingAddressId?: number;
}