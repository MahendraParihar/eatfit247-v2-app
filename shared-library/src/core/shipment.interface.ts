import { IBaseAdminUser, IAdminInfo } from '../base.interface';
import { ShipmentStatusEnum, ShipmentTrackingEnum, ShipmentTrackingSourceEnum } from '../enum';
import { IAddress } from './location.interface';

export interface IShipmentItem {
  shipmentItemId: number;
  shipmentId: number;
  memberProductOrderItemId?: number;
  quantity: number;
}

export interface IShipmentTrackingEvent {
  shipmentTrackingEventId: number;
  shipmentId: number;
  status: ShipmentTrackingEnum;
  description?: string;
  eventTime: Date;
  source?: ShipmentTrackingSourceEnum;
  createdAt: Date;
}

export interface IBasicShipment {
  memberProductId: number;
  franchiseId: number;
  shipmentNo: string;
  courier?: string;
  trackingNo?: string;
  trackingUrl?: string;
  status: ShipmentStatusEnum;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface IShipment extends IBasicShipment, IAdminInfo {
  shipmentId: number;
  shipmentItems?: IShipmentItem[];
  trackingEvents?: IShipmentTrackingEvent[];
}

export interface IShipmentDetails {
  shipmentId: number;
  shipmentNumber: string;
  orderId: number;
  orderType: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  totalWeightKg?: number;
  totalAmount?: number;
  codAmount?: number;
  rateAmount?: number;
  currency?: string;
  providerId?: number;
  providerName?: string;
  serviceName?: string;
  estimatedDays?: number;
  memberId: number;
  memberName: string;
  address?: IAddress;
  orderItems?: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRateQuote {
  rateQuoteId: number;
  providerId: number;
  providerName: string;
  serviceId?: number;
  serviceName: string;
  rateAmount: number;
  currency: string;
  estimatedDays?: number;
  estimatedDeliveryDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface ITrackingEvent {
  trackingEventId: number;
  providerStatus: string;
  internalStatus: string;
  description?: string;
  eventTime: Date;
  location?: string;
}

export interface ITrackingInfo {
  trackingNumber: string;
  trackingUrl?: string;
  currentStatus: string;
  providerName?: string;
  estimatedDeliveryDate?: Date;
  trackingEvents: ITrackingEvent[];
}

