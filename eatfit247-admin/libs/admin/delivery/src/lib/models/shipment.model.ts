/**
 * Shipment Models
 *
 * Type definitions for shipment flow
 */
import { IRateQuote, ITrackingInfo, IShipmentItem } from '@eatfit247-shared-lib';

export interface IOrderItem {
  memberProductOrderItemId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface IOrderItemShipmentGroup {
  orderItem: IOrderItem;
  quantity: number;
  shipments: Array<{
    shipmentId: number;
    shipmentNumber: string;
    status: string;
    quantity: number;
  }>;
}

export interface IAddItemsPayload {
  items: Array<{
    memberProductOrderItemId: number;
    quantity: number;
  }>;
}

export interface ICreateDraftPayload {
  memberProductId: number;
  items?: Array<{
    memberProductOrderItemId: number;
    quantity: number;
  }>;
}

export interface ISelectRatePayload {
  rateQuoteId?: number;
  providerId?: number;
}

export interface IBookShipmentPayload {
  rateQuoteId?: number;
  providerId?: number;
}

export type ShipmentStatus =
  | 'DRAFT'
  | 'RATE_REQUESTED'
  | 'RATE_SELECTED'
  | 'BOOKING_REQUESTED'
  | 'BOOKED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED';

export interface ShipmentFlowData {
  memberProductId: number;
  memberId: number;
  shipmentId?: number;
}

export type { IRateQuote, ITrackingInfo, IShipmentItem };
