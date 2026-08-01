import {IAddress, IMemberAddress} from "../location.interface";
import {PaymentSourceEnum, TaxMode, TaxTypeEnum} from "../../enum";
import {IAdminInfo, IDropdownItem} from "../../base.interface";

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
  paymentModeId?: number;
  programId?: number | null;
  programPlanId: number;
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

export interface IMemberPaymentUpdateChange {
  field: string;
  label: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  changed: boolean;
}

export interface IMemberDietPlanOverLimitDetail {
  memberDietDetailId: number;
  cycleNo: number;
  dayNo?: number | null;
  type: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

export interface IMemberDietPlanLimitImpact {
  hasDietPlan: boolean;
  memberDietPlanId?: number;
  currentNoOfCycle?: number;
  currentDaysInCycle?: number;
  newNoOfCycle: number;
  newDaysInCycle: number;
  currentCycleNo?: number | null;
  currentDayNo?: number | null;
  maxCreatedCycleNo?: number | null;
  maxCreatedDayNo?: number | null;
  extraCyclesGiven: number;
  extraDaysGiven: number;
  detailRowsBeyondNewLimits: IMemberDietPlanOverLimitDetail[];
  cycleChanged: boolean;
  daysInCycleChanged: boolean;
  hasOverLimitDietDetails: boolean;
  highlights: string[];
  warnings: string[];
}

export interface IMemberPaymentUpdatePreview {
  memberPaymentId: number;
  requiresConfirmation: boolean;
  changes: IMemberPaymentUpdateChange[];
  dietPlanImpact: IMemberDietPlanLimitImpact;
  highlights: string[];
  warnings: string[];
}
