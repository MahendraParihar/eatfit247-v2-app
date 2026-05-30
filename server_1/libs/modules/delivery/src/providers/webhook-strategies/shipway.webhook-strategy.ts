import { Injectable } from '@nestjs/common';
import { BaseWebhookStrategy } from './base-webhook.strategy';
import {
  IWebhookAuthInput,
  IWebhookAuthResult,
  IWebhookEventData,
} from './webhook-strategy.interface';

/**
 * Shipway webhook quirks:
 *  - Auth: Shipway posts `username` + `password` (Licence Key) IN THE BODY.
 *    No header signature. We compare `body.password` against the stored secret.
 *  - Payload is wrapped: real data lives under `response: { ... }`.
 *  - Status comes as a short alpha code in `current_status_code` (DEL, INT, OOD, ...).
 */
@Injectable()
export class ShipwayWebhookStrategy extends BaseWebhookStrategy {
  readonly providerCode = 'SHIPWAY';

  /** Short-code → canonical token recognized by ShipmentRecordService.mapProviderStatus. */
  private static readonly STATUS_BUCKET: Record<string, string> = {
    SCH: 'BOOKED',
    PKP: 'PICKUP_SCHEDULED',
    INT: 'IN_TRANSIT',
    NWI: 'IN_TRANSIT',
    DNB: 'IN_TRANSIT',
    SMD: 'IN_TRANSIT',
    OOD: 'OUT_FOR_DELIVERY',
    OT: 'OUT_FOR_DELIVERY',
    DRE: 'OUT_FOR_DELIVERY',
    DL: 'DELIVERED',
    DEL: 'DELIVERED',
    RTO: 'RTO',
    RTD: 'RTO',
    CAN: 'CANCELLED',
    UND: 'FAILED',
    UD: 'FAILED',
    LOST: 'FAILED',
    ONH: 'FAILED',
    NFI: 'FAILED',
    ODA: 'FAILED',
    CRTA: 'FAILED',
    CNA: 'FAILED',
    DEX: 'FAILED',
    PNR: 'FAILED',
  };

  verifyAuth(input: IWebhookAuthInput, secret: string | null): IWebhookAuthResult {
    if (!secret || secret.trim().length === 0) {
      return { valid: true, reason: 'No webhook secret configured' };
    }
    const trimmedSecret = secret.trim();
    const body = input.body as Record<string, unknown>;
    const candidate = String(body?.['password'] ?? body?.['licence_key'] ?? '').trim();

    if (!candidate) {
      return { valid: false, reason: 'Missing password/licence_key in body' };
    }
    return this.timingSafeMatch(candidate, trimmedSecret)
      ? { valid: true, reason: '' }
      : { valid: false, reason: 'Invalid webhook secret' };
  }

  extractEvent(body: Record<string, any>): IWebhookEventData {
    // Shipway wraps the data under `response`. Some integrations also bubble the
    // fields up to top-level — accept either shape.
    const root = (body?.response as Record<string, any>) ?? body;
    const scans = Array.isArray(root?.scan) ? (root.scan as Record<string, any>[]) : [];
    const lastScan = scans.length > 0 ? scans[scans.length - 1] : null;

    const awbNumber = this.pickFirstNonEmpty([
      body?.awb,
      body?.awbno,
      body?.awb_number,
      root?.awb,
      root?.awbno,
    ]);

    const code = this.pickFirstNonEmpty([
      root?.current_status_code,
      root?.status_code,
      body?.current_status_code,
    ]);
    const longStatus = this.pickFirstNonEmpty([root?.current_status, body?.current_status]);

    const upperCode = code ? code.toUpperCase().trim() : '';
    const bucketed = upperCode
      ? ShipwayWebhookStrategy.STATUS_BUCKET[upperCode] ?? upperCode
      : longStatus
      ? this.normalizeStatusForMapper(longStatus)
      : null;

    return {
      awbNumber,
      providerStatus: code ?? longStatus,
      normalizedStatus: bucketed,
      description: String(lastScan?.status_detail ?? longStatus ?? ''),
      eventTime: this.extractEventTimeOrNow([
        lastScan?.time,
        root?.time,
        root?.pickupdate,
        body?.time,
      ]),
      location: (lastScan?.location as string) ?? (root?.from as string) ?? null,
    };
  }
}
