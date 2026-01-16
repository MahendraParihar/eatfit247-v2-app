import { IMemberPayment } from './member-payment.interface';

/**
 * Payment Report Interfaces
 * Shared interfaces for payment reporting across frontend and backend
 */

export interface IPaymentReportFilter {
  startDate: string;
  endDate: string;
  franchiseId?: number;
}

export interface IPaymentReportItem extends IMemberPayment {
  franchiseName?: string;
}

