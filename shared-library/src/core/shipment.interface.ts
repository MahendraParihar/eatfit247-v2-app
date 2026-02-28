import { IAdminInfo } from '../base.interface';
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

export interface IShipmentAddress{
  postcode: string;
  address: string;
  city: string;
  state: string;
  name: string;
  phone: string;
}

export interface IShipmentItemDimensions{
    length:number;
    breadth:number;
    height:number;
    width:number;
}

export interface IShipmentMetaData{
  idempotencyKeys?: {[key:string]: string};
    pickup?: IShipmentAddress;
    delivery?: IShipmentAddress;
  billing?: IShipmentAddress;
  shipping?: IShipmentAddress;
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
  shipmentNumber: string;
  providerId?: number;
  providerAccountId?: number;
  franchiseId: number;
  trackingNumber?: string;
  trackingUrl?: string;
  totalWeightKg?: number;
  totalAmount?: number;
  rateAmount?: number;
  currency?: string;
  status: string;
  providerName?: string;
  serviceName?: string;
  metaData?: IShipmentMetaData;
  shipmentItems?: IShipmentItem[];
  trackingEvents?: IShipmentTrackingEvent[];
}

export interface IRateQuote {
  rateQuoteId?: number;
  providerId: number;
  providerName?: string;
  serviceId?: number;
  serviceCode: string;
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

export interface INimbusShipmentPayload{
  "order_number": string;
    "payment_type": string;
    "order_amount": number;
    "cod_amount": number,
    "package_weight": number,
    "package_length": number,
    "package_breadth": number,
    "package_height": number,
    "pickup_location": string;
    "billing_customer_name": string;
    "billing_last_name": string;
    "billing_address": string;
    "billing_city": string;
    "billing_pincode": string;
    "billing_state": string;
    "billing_country": string;
    "billing_email": string;
    "billing_phone": string;
    "shipping_is_billing": true;
    "order_items":{
      "name": string;
      "sku": string;
      "units": number,
      "selling_price": number,
      "discount": number,
      "tax": number,
      "hsn": string }[];
    "support_email": string;
    "support_phone": string;
}