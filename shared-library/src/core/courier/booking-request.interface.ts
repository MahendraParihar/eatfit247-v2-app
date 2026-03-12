import { IShipmentItemDimensions } from '../shipment.interface';

export interface IShipmentAddress {
  pincode: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  name: string;
  email?: string;
  country?: string;
  phone: string;
}

export interface IShipmentDimensions extends IShipmentItemDimensions {
  mode?: string;
}

export interface IBookingItem {
  name: string;
  sku?: string;
  quantity?: number;
  price?: number;
}

export interface ICommonBookingRequest {
  shipmentId?: number;
  shipmentNumber?: string;
  pickup: IShipmentAddress;
  delivery: IShipmentAddress;
  orderAmount?: number;
  codAmount?: number;
  weight?: number;
  dimensions?: IShipmentDimensions;
  items?: IBookingItem[];
}

export interface IBookingRequest extends ICommonBookingRequest{
  idempotencyKey?: string;
  forceRetry?: boolean;
}

export interface IRateRequest extends ICommonBookingRequest{
  pickupPostcode?: number;
  deliveryPostcode?: number;
}
