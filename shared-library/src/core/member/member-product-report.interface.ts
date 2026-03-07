import { IMemberProduct } from './member-product.interface';

/**
 * Member Product Order Report Interfaces
 * Shared interfaces for member product order reporting across frontend and backend
 */

export interface IMemberProductReportFilter {
  startDate: string;
  endDate: string;
  franchiseId?: number;
  paymentStatusId?: number;
}

export interface IMemberProductReportItem extends IMemberProduct {
  franchiseName?: string;
  memberEmail?: string;
  memberContactNumber?: string;
  productNames?: string;
  itemCount?: number;
}

