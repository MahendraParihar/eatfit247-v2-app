import { ICreateUpdate, IDropdownItem } from "./common.interface";
import { IAddress, IAddressBasic } from "./address.interface";
import { IPlanFees } from "./program-plan.interface";
import { ICurrencyConfigList } from "./currency.interface";

export interface IMemberPayment extends ICreateUpdate {
  id: number;
  memberId: number;
  memberName: string;
  paymentModeId: number;
  paymentMode: string;
  addressId: number;
  transactionId: string;
  invoiceId: string;
  paymentStatusId: number;
  paymentStatus: string;
  paymentObj: any;
  refundObj: any;
  promoCode: string;
  isTaxApplicable: boolean;
  date: string | Date;
  orderAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxObject?: object;
  paymentGatewayResponse?: object;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  deletable: boolean;
  address?: IAddress;
  billingAddress?: IAddress;
  gstNumber?: string;
  program: string;
  plan: string;
}

export interface IManageMemberPayment {
  paymentDate: Date;
  noOfCycle: number;
  daysInCycle: number;
  isTaxApplicable: boolean;
  memberId: number;
  paymentModeId: number;
  programId: number;
  planId: number;
  paymentStatusId: number;
  transactionId?: string;
  systemDiscountAmount: number;
  userCurrency: string;
  active?: boolean;
  address?: IAddressBasic;
}

export class IPaymentReport {
  fromDate: string;
  toDate: string;
  gstOnly: boolean;
}

export interface IMemberPaymentMasterData {
  paymentMode: IDropdownItem[];
  program: IDropdownItem[];
  plan: IPlanFees[];
  currencyConfig: ICurrencyConfigList[];
  paymentStatus: IDropdownItem[];
  addresses: IAddress[];
  taxPercentage: number;
  taxApplicable: boolean;
}
