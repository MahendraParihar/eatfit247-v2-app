/**
 * Webhook payload interfaces by courier provider.
 * Providers may use snake_case or camelCase - interfaces support both.
 */

/** Common tracking identifier field names across providers */
export interface ITrackingIdentifierFields {
  tracking_number?: string;
  trackingNumber?: string;
  awb_number?: string;
  awbNumber?: string;
  tracking_id?: string;
  trackingId?: string;
}

/** Common shipment/order identifier field names */
export interface IShipmentIdentifierFields {
  shipment_id?: string;
  shipmentId?: string;
  order_id?: string;
  orderId?: string;
  provider_shipment_id?: string;
  providerShipmentId?: string;
}

/** Common status field names */
export interface IStatusFields {
  status?: string;
  event_status?: string;
  eventStatus?: string;
  current_status?: string;
  currentStatus?: string;
  provider_status?: string;
  providerStatus?: string;
}

/** Common description/message field names */
export interface IDescriptionFields {
  description?: string;
  message?: string;
  event_description?: string;
  eventDescription?: string;
}

/** Common timestamp field names */
export interface ITimestampFields {
  event_time?: string | number;
  eventTime?: string | number;
  timestamp?: string | number;
  created_at?: string | number;
  createdAt?: string | number;
}

/** Common location field names */
export interface ILocationFields {
  location?: string;
  city?: string;
  location_name?: string;
  locationName?: string;
}

/**
 * Base webhook payload - union of common field variants.
 * Used when parsing provider-agnostic webhooks.
 */
export interface IBaseWebhookPayload
  extends ITrackingIdentifierFields,
    IShipmentIdentifierFields,
    IStatusFields,
    IDescriptionFields,
    ITimestampFields,
    ILocationFields {}

/**
 * Nimbus webhook payload.
 * Based on NimbusPost tracking webhook format.
 */
export interface INimbusWebhookPayload extends IBaseWebhookPayload {
  /** Nimbus may use awb for AWB number */
  awb?: string;
  /** Nimbus event type */
  event?: string;
  /** Nimbus scan type */
  scan_type?: string;
  scanType?: string;
}

/**
 * Shiprocket webhook payload.
 * Based on Shiprocket tracking webhook format.
 */
export interface IShiprocketWebhookPayload extends IBaseWebhookPayload {
  /** Shiprocket AWB code */
  awb_code?: string;
  awbCode?: string;
  /** Shiprocket courier name */
  courier_name?: string;
  courierName?: string;
  /** Shiprocket shipment status */
  shipment_status?: string;
  shipmentStatus?: string;
}

/** Union of supported provider webhook payloads */
export type ICourierWebhookPayload = INimbusWebhookPayload | IShiprocketWebhookPayload;

/** Webhook request headers - for signature validation, etc. */
export interface IWebhookHeaders {
  [key: string]: string | string[] | undefined;
}

/** Webhook handling result */
export interface IWebhookHandleResult {
  webhookLogId: number;
  processed: boolean;
  message: string;
}

/** Parsed webhook data extracted from raw payload */
export interface IParsedWebhookData {
  trackingNumber?: string;
  providerShipmentId?: string;
  status: string;
  description?: string;
  eventTime?: Date;
  location?: string;
}

/**
 * Generic webhook payload - use when payload structure is unknown (e.g. from DB).
 * Prefer IBaseWebhookPayload when receiving from HTTP.
 */
export type IUnknownWebhookPayload = Record<string, unknown>;
