/**
 * One IWebhookStrategy implementation per courier provider.
 * Encapsulates the provider-specific quirks of inbound webhook traffic:
 *  - authentication (HMAC vs shared-secret-in-header vs shared-secret-in-body)
 *  - payload field locations (some providers nest under `data` or `response`)
 *  - status taxonomy (free-text strings vs short codes vs numeric ids)
 *
 * The IWebhookStrategy contract is dispatch-only — it does not touch the
 * database. CourierWebhookService owns persistence and calls strategy methods
 * to interrogate the incoming request.
 */

export interface IWebhookAuthInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
}

export interface IWebhookAuthResult {
  valid: boolean;
  reason: string;
}

export interface IWebhookEventData {
  awbNumber: string | null;
  /** Raw provider status string/code as the provider sent it */
  providerStatus: string | null;
  /** Provider status normalized for ShipmentRecordService.mapProviderStatus */
  normalizedStatus: string | null;
  description: string;
  eventTime: Date;
  location: string | null;
}

export interface IWebhookStrategy {
  /** Provider code in upper case (NIMBUS / SHIPROCKET / SHIPWAY). */
  readonly providerCode: string;

  /**
   * Verify the request actually came from the provider.
   * `secret` is the value from txn_courier_provider_accounts.webhook_secret.
   * When secret is null/empty the strategy may accept the request as unverified
   * (and the service records signatureValid=true with a logged note).
   */
  verifyAuth(input: IWebhookAuthInput, secret: string | null): IWebhookAuthResult;

  /**
   * Extract everything we need from the payload in one pass.
   * Any field that can't be found returns null (caller decides what to do).
   */
  extractEvent(body: Record<string, unknown>): IWebhookEventData;
}
