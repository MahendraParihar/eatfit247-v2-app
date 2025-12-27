import { IBaseAdminUser, IDropdownItem } from "../base.interface";
import { IAddress, IManageAddress } from "./location.interface";

export interface IBasicMemberPayment {
  memberId: number;
  paymentModeId: number;
  programPlanId: number;
  programId: number;
  addressId: number;
  transactionId: string;
  paymentDate: Date;
  invoiceId: string;
  paymentStatusId: number;
  promoCode: string;
  isTaxApplicable: boolean;
  paymentObj: object;
  refundObj: object;
  paymentGatewayResponse: object;
  gstNumber?: string;
  billingAddressId?: number;
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

export interface IManageMemberPayment extends IBasicMemberPayment {
  memberPaymentId?: number;
  address?: IManageAddress;
  billingAddress?: IManageAddress;
}

export interface IPaymentReport {
  fromDate: Date;
  toDate: Date;
  gstOnly: boolean;
}

export interface IMemberPaymentMasterData {
  paymentMode: IDropdownItem[];
  program: IDropdownItem[];
  // plan: IPlanFees[];
  // currencyConfig: ICurrencyConfigList[];
  paymentStatus: IDropdownItem[];
  addresses: IAddress[];
  taxPercentage: number;
  taxApplicable: boolean;
}
