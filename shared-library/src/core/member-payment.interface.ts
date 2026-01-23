import { IBaseAdminUser, IDropdownItem } from '../base.interface';
import { IAddress, IMemberAddress } from './location.interface';
import { PaymentSourceEnum, TaxMode, TaxTypeEnum } from '../enum';
import { IProduct } from './product.interface';

export interface IMemberAddressSnapshot {
  address: IMemberAddress | null;
  billingAddress: IMemberAddress | null;
}

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
  isPlanFeesIncludedTax: boolean;
  currency: string;
  taxType: TaxTypeEnum;
  taxMode: TaxMode;
  isLutApplied: boolean;
  isTaxIncluded: boolean;
  taxObj?: Record<string, { amount: number; taxPercentage: number }>;
  jurisdiction?: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
  invoiceNote?: string;
}

export interface IMemberPayment extends IBasicMemberPayment {
  memberPaymentId: number;
  memberName: string;
  paymentMode: string;
  programPlan: string;
  program: string;
  address?: IAddress;
  paymentStatus: string;
  memberAddress?: IMemberAddressSnapshot;
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
  promoCode?: string;
  gstNumber?: string;
  paymentSource: PaymentSourceEnum;
  paymentLink?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
  currency?: string;
  isTaxApplicable: boolean;
  taxPercentage: number;
  isPlanFeesIncludedTax: boolean;
  taxType?: TaxTypeEnum;
  taxMode?: TaxMode;
  isLutApplied?: boolean;
  isTaxIncluded?: boolean;
  taxObj?: Record<string, { amount: number; taxPercentage: number }>;
  jurisdiction?: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
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

export interface IMemberProductMasterData {
  paymentMode: IDropdownItem[];
  product: IProduct[];
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