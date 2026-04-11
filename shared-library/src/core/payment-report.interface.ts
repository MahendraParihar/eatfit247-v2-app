import {IMemberPayment} from "./member";

export interface IPaymentReportFilter {
  startDate: string;
  endDate: string;
  franchiseId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaymentReportItem extends IMemberPayment {
  franchiseName?: string;
}

