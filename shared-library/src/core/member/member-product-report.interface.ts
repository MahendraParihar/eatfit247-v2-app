import { ShipmentStatusEnum } from '../../enum';
import { IMemberProduct } from './member-product.interface';

/**
 * Member Product Order Report Interfaces
 * Shared interfaces for member product order reporting across frontend and backend
 */

export interface IMemberProductReportShipment {
  shipmentId: number;
  orderId: number;
  shipmentNumber: string;
  status: string;
  lastKnownStatus?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  receiverName?: string | null;
  receiverCity?: string | null;
  receiverState?: string | null;
  receiverPincode?: string | null;
  providerName?: string;
  lastError?: string | null;
  retryCount?: number;
}

export interface IMemberProductReportFilter {
  startDate: string;
  endDate: string;
  franchiseId?: number;
  paymentStatusId?: number;
  hasShipment?: boolean;
  shipmentStatus?: ShipmentStatusEnum;
}

export interface IMemberProductReportItem extends IMemberProduct {
  franchiseName?: string;
  memberEmail?: string;
  memberContactNumber?: string;
  productNames?: string;
  itemCount?: number;
  shipment?: IMemberProductReportShipment | null;
}
