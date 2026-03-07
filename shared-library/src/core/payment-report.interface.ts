import {IMemberPayment} from "./member";

export interface IPaymentReportFilter {
  startDate: string;
  endDate: string;
  franchiseId?: number;
}

export interface IPaymentReportItem extends IMemberPayment {
  franchiseName?: string;
}

