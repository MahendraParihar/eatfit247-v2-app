/**
 * Processing result of a stored payment-gateway webhook event
 * (`txn_payment_gateway_events.result`).
 */
export enum GatewayEventResultEnum {
  /** The event changed the record (e.g. PENDING → PAID). */
  APPLIED = 'APPLIED',
  /** Same (provider, event_id) was already received; nothing done. */
  IGNORED_DUPLICATE = 'IGNORED_DUPLICATE',
  /** The record's current status does not allow this transition (e.g. failed after PAID). */
  IGNORED_STATE = 'IGNORED_STATE',
  /** No plan or product record matches the gateway order id. */
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  /** Processing failed (amount/currency mismatch, unexpected error). */
  ERROR = 'ERROR',
}
