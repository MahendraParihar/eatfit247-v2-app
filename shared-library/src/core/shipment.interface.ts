import { IBaseAdminUser } from '../base.interface';
import { ShipmentStatusEnum, ShipmentTrackingEnum, ShipmentTrackingSourceEnum } from '../enum';

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

export interface IShipment extends IBasicShipment {
  shipmentId: number;
  shipmentItems?: IShipmentItem[];
  trackingEvents?: IShipmentTrackingEvent[];
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

