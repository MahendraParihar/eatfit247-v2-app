import moment from 'moment';
import { ICreateUpdate } from './lov.interface';
import { IAddress } from './address.interface';

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
  date: moment.Moment;
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
