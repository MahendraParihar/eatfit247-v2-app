/**
 * Shipment Models
 * 
 * Type definitions for shipment flow
 */
import { IShipmentDetails, IRateQuote, ITrackingInfo, IShipmentItem } from '@eatfit247-shared-lib';

export interface IOrderItem {
  memberProductOrderItemId: number;
  productName: string;
  orderedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface IAddItemsPayload {
  items: Array<{
    memberProductOrderItemId: number;
    quantity: number;
  }>;
}

export interface ISelectRatePayload {
  providerId: number;
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
  shipmentId?: number;
}

export type { IShipmentDetails, IRateQuote, ITrackingInfo, IShipmentItem };

