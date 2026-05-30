import { Injectable } from '@nestjs/common';
import { BaseWebhookStrategy } from './base-webhook.strategy';
import {
  IWebhookAuthInput,
  IWebhookAuthResult,
  IWebhookEventData,
} from './webhook-strategy.interface';

/**
 * NimbusPost webhook quirks:
 *  - No public HMAC spec. Some accounts get HMAC-SHA256(base64) in x-hmac-sha256;
 *    most send a plain shared secret in x-webhook-secret / x-nimbuspost-secret / x-api-key.
 *    We accept either, preferring HMAC.
 *  - Field names mostly flat but occasionally nested under `data.shipment.*`.
 *  - Status strings are free-text ("In Transit", "Out For Delivery", "RTO Initiated").
 */
@Injectable()
export class NimbusWebhookStrategy extends BaseWebhookStrategy {
  readonly providerCode = 'NIMBUS';

  verifyAuth(input: IWebhookAuthInput, secret: string | null): IWebhookAuthResult {
    if (!secret || secret.trim().length === 0) {
      return { valid: true, reason: 'No webhook secret configured' };
    }
    const trimmedSecret = secret.trim();

    const hmacHeader = this.headerValue(input.headers, 'x-hmac-sha256');
    if (hmacHeader) {
      const computed = this.computeHmacSha256Base64(input.rawBody, trimmedSecret);
      return this.timingSafeMatch(hmacHeader, computed)
        ? { valid: true, reason: '' }
        : { valid: false, reason: 'Invalid HMAC signature' };
    }

    const sharedSecret =
      this.headerValue(input.headers, 'x-webhook-secret') ||
      this.headerValue(input.headers, 'x-nimbuspost-secret') ||
      this.headerValue(input.headers, 'x-api-key');

    if (!sharedSecret) {
      return { valid: false, reason: 'Missing webhook auth header' };
    }
    return this.timingSafeMatch(sharedSecret, trimmedSecret)
      ? { valid: true, reason: '' }
      : { valid: false, reason: 'Invalid webhook secret' };
  }

  extractEvent(body: Record<string, any>): IWebhookEventData {
    const awbNumber = this.pickFirstNonEmpty([
      body?.awb_number,
      body?.awb,
      body?.waybill,
      body?.data?.awb_number,
      body?.data?.awb,
      body?.data?.shipment?.awb_number,
      body?.data?.shipment?.awb,
      body?.shipment?.awb_number,
      body?.shipment?.awb,
    ]);

    const providerStatus = this.pickFirstNonEmpty([
      body?.current_status,
      body?.shipment_status,
      body?.status,
      body?.data?.current_status,
      body?.data?.shipment_status,
      body?.data?.status,
      body?.data?.shipment?.status,
    ]);

    return {
      awbNumber,
      providerStatus,
      normalizedStatus: providerStatus ? this.normalizeStatusForMapper(providerStatus) : null,
      description: String(
        body?.message ?? body?.status_body ?? body?.remark ?? body?.data?.message ?? '',
      ),
      eventTime: this.extractEventTimeOrNow([
        body?.event_time,
        body?.timestamp,
        body?.updated_at,
        body?.data?.event_time,
        body?.data?.updated_at,
      ]),
      location: (body?.location as string) ?? (body?.data?.location as string) ?? null,
    };
  }
}
