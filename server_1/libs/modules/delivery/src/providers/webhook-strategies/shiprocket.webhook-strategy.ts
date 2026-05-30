import { Injectable } from '@nestjs/common';
import { BaseWebhookStrategy } from './base-webhook.strategy';
import {
  IWebhookAuthInput,
  IWebhookAuthResult,
  IWebhookEventData,
} from './webhook-strategy.interface';

/**
 * Shiprocket webhook quirks:
 *  - Auth: shared static token in x-api-key (configured on Shiprocket dashboard).
 *    No HMAC, no per-request signature.
 *  - Flat payload with `awb`, `current_status` (UPPERCASE strings), `scans[]`.
 *  - Most recent location/time come from the tail of `scans[]`.
 *  - Status strings need bucket-mapping: "PICKED UP", "RTO INITIATED", etc.
 */
@Injectable()
export class ShiprocketWebhookStrategy extends BaseWebhookStrategy {
  readonly providerCode = 'SHIPROCKET';

  /** Map Shiprocket's free-text status into a token ShipmentRecordService.mapProviderStatus understands. */
  private static readonly STATUS_BUCKET: Record<string, string> = {
    NEW: 'BOOKED',
    INVOICED: 'BOOKED',
    'READY TO SHIP': 'BOOKED',
    'PICKUP GENERATED': 'BOOKED',
    'LABEL GENERATED': 'BOOKED',
    'MANIFEST GENERATED': 'BOOKED',
    'PICKUP SCHEDULED': 'PICKUP_SCHEDULED',
    'PICKUP QUEUED': 'PICKUP_SCHEDULED',
    'PICKUP RESCHEDULED': 'PICKUP_SCHEDULED',
    'PICKUP ERROR': 'FAILED',
    SHIPPED: 'IN_TRANSIT',
    'IN TRANSIT': 'IN_TRANSIT',
    DISPATCHED: 'IN_TRANSIT',
    'REACHED CITY': 'IN_TRANSIT',
    'REACHED DESTINATION': 'IN_TRANSIT',
    MISROUTED: 'IN_TRANSIT',
    'PACKET ARRIVED AT GATEWAY': 'IN_TRANSIT',
    'PACKET DEPARTED FROM GATEWAY': 'IN_TRANSIT',
    'OUT FOR DELIVERY': 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    'DELIVERY DONE': 'DELIVERED',
    'RTO INITIATED': 'RTO',
    'RTO IN TRANSIT': 'RTO',
    'RTO DELIVERED': 'RTO',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
    UNDELIVERED: 'FAILED',
    LOST: 'FAILED',
  };

  verifyAuth(input: IWebhookAuthInput, secret: string | null): IWebhookAuthResult {
    if (!secret || secret.trim().length === 0) {
      return { valid: true, reason: 'No webhook secret configured' };
    }
    const trimmedSecret = secret.trim();

    const token =
      this.headerValue(input.headers, 'x-api-key') ||
      this.headerValue(input.headers, 'x-webhook-token') ||
      this.headerValue(input.headers, 'x-webhook-secret');

    if (!token) {
      return { valid: false, reason: 'Missing x-api-key header' };
    }
    return this.timingSafeMatch(token, trimmedSecret)
      ? { valid: true, reason: '' }
      : { valid: false, reason: 'Invalid webhook secret' };
  }

  extractEvent(body: Record<string, any>): IWebhookEventData {
    const awbNumber = this.pickFirstNonEmpty([
      body?.awb,
      body?.awb_code,
      body?.awb_number,
      body?.tracking_number,
    ]);

    const rawStatus = this.pickFirstNonEmpty([body?.current_status]);
    const normalizedKey = rawStatus ? rawStatus.toUpperCase().trim() : '';
    const bucketed = normalizedKey
      ? ShiprocketWebhookStrategy.STATUS_BUCKET[normalizedKey] ?? this.normalizeStatusForMapper(rawStatus!)
      : null;

    // Pull the latest scan entry for location + timestamp + description
    const scans = Array.isArray(body?.scans) ? (body.scans as Record<string, any>[]) : [];
    const lastScan = scans.length > 0 ? scans[scans.length - 1] : null;

    return {
      awbNumber,
      providerStatus: rawStatus,
      normalizedStatus: bucketed,
      description: String(lastScan?.activity ?? lastScan?.status_message ?? body?.message ?? ''),
      eventTime: this.extractEventTimeOrNow([
        lastScan?.date,
        body?.current_timestamp,
        body?.updated_at,
        body?.etd,
      ]),
      location:
        (lastScan?.location as string) ??
        (body?.current_location as string) ??
        (body?.location as string) ??
        null,
    };
  }
}
