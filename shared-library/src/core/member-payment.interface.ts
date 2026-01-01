import { IBaseAdminUser, IDropdownItem } from "../base.interface";
import { IAddress, IManageAddress } from "./location.interface";
import { PaymentSourceEnum } from "../enum";

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
  paymentObj: object;
  refundObj?: object | null;
  paymentGatewayResponse?: object | null;
  gstNumber?: string;
  billingAddressId?: number | null;
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
  address: IManageAddress;
  billingAddress: IManageAddress;
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
