import {
  MstCourierProvider,
  MstWarehouse,
  TxnCourierProviderAccount,
  TxnCourierProviderWarehouse,
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentRateQuote,
  TxnShipmentTrackingEvent,
  TxnCourierApiLog,
  TxnCourierWebhookLog,
} from '../models';

export const DeliveryModelTokens = {
  courierProvider: MstCourierProvider.name,
  warehouse: MstWarehouse.name,
  courierProviderAccount: TxnCourierProviderAccount.name,
  courierProviderWarehouse: TxnCourierProviderWarehouse.name,
  shipment: TxnShipment.name,
  shipmentItem: TxnShipmentItem.name,
  shipmentRateQuote: TxnShipmentRateQuote.name,
  shipmentTrackingEvent: TxnShipmentTrackingEvent.name,
  courierApiLog: TxnCourierApiLog.name,
  courierWebhookLog: TxnCourierWebhookLog.name,
} as const;
