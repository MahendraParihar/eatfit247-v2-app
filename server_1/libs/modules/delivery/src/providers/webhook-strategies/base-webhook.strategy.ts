import * as crypto from 'crypto';
import {
  IWebhookAuthInput,
  IWebhookAuthResult,
  IWebhookEventData,
  IWebhookStrategy,
} from './webhook-strategy.interface';

export abstract class BaseWebhookStrategy implements IWebhookStrategy {
  abstract readonly providerCode: string;

  abstract verifyAuth(input: IWebhookAuthInput, secret: string | null): IWebhookAuthResult;
  abstract extractEvent(body: Record<string, unknown>): IWebhookEventData;

  // ── Auth helpers ─────────────────────────────────────────────────────────

  protected headerValue(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) return String(value[0] ?? '').trim();
    return String(value ?? '').trim();
  }

  protected timingSafeMatch(a: string, b: string): boolean {
    const left = new Uint8Array(Buffer.from(a, 'utf8'));
    const right = new Uint8Array(Buffer.from(b, 'utf8'));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
  }

  protected computeHmacSha256Base64(rawBody: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  }

  // ── Payload helpers ──────────────────────────────────────────────────────

  protected pickFirstNonEmpty(values: unknown[]): string | null {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      const normalized = String(value).trim();
      if (normalized) return normalized;
    }
    return null;
  }

  protected parseDate(value: unknown): Date | null {
    if (!value) return null;
    const date = new Date(value as string | number | Date);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  protected extractEventTimeOrNow(candidates: unknown[]): Date {
    for (const candidate of candidates) {
      const parsed = this.parseDate(candidate);
      if (parsed) return parsed;
    }
    return new Date();
  }

  /**
   * Normalize a status string so ShipmentRecordService.mapProviderStatus()
   * (which uppercases and substring-matches against IN_TRANSIT,
   * OUT_FOR_DELIVERY etc.) recognizes it.
   */
  protected normalizeStatusForMapper(raw: string): string {
    return raw.trim().toUpperCase().replace(/\s+/g, '_');
  }
}
