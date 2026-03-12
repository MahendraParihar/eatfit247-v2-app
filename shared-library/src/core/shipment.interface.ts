import {IAdminInfo} from '../base.interface';
import {ShipmentTrackingEnum, ShipmentTrackingSourceEnum} from '../enum';

export interface ICreateShipmentPayload {
  orderId: number;
  franchiseId: number;
  shipmentNumber: string;
  totalAmount: number;
  currency: string;
  totalWeightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverPincode: string;
  receiverCountry: string;
  items: ICreateShipmentItemPayload[];
  createdBy: number;
  createdIp: string;
}

export interface ICreateShipmentItemPayload {
  memberProductOrderItemId: number;
  quantity: number;
}

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

export interface IShipmentItemDimensions{
    length:number;
    breadth:number;
    height:number;
    width:number;
}

export interface IShipmentMetaData{
  idempotencyKeys?: {[key:string]: string};
    weight?: number;
    dimensions?: IShipmentItemDimensions;
    codAmount:number;
    orderId?: string;
  bookingResponse?: Record<string, any>;
  labelUrl?: string;
  awbNumber?: string;
  orderDate?: Date;
  serviceName?:string;
}

export interface IShipment extends IAdminInfo {
  shipmentId: number;
  orderId: number;
  shipmentNumber: string;
  courierProviderId?: number;
  providerAccountId?: number;
  franchiseId: number;
  warehouseId: number;
  trackingNumber?: string;
  trackingUrl?: string;
  totalWeightKg?: number;
  totalAmount?: number;
  rateAmount?: number;
  currency?: string;
  status: string;
  providerName?: string;
  serviceName?: string;
  metaData?: object;
  shipmentItems?: IShipmentItem[];
  trackingEvents?: IShipmentTrackingEvent[];
}