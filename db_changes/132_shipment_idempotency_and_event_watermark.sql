-- =============================================================================
-- Shipment hardening: idempotency key, event-time watermark, cron claim lock
-- =============================================================================
-- Three safety additions to txn_shipments, all targeting expert-review findings
-- on the delivery module:
--
--   1. idempotency_key (UUID)
--      Stable carrier-facing order identifier. Generated once per shipment row
--      and reused across all retries. Threaded through to the courier adapters
--      so Shiprocket / Shipway / Nimbus see the same order_id on every retry —
--      which lets carriers that enforce uniqueness reject duplicates instead
--      of producing a second AWB.
--
--   2. last_status_event_at (TIMESTAMPTZ)
--      High-water mark of the most recent provider event time accepted for
--      this shipment. Used in saveTrackingEvents to refuse status regressions
--      from out-of-order webhook / polling deliveries (e.g. a stale IN_TRANSIT
--      arriving after DELIVERED).
--
--   3. retry_claimed_at (TIMESTAMPTZ)
--      Cooperative claim marker for the retry & status-sync crons. Each cron
--      worker conditionally UPDATEs this column with a stale-claim TTL; only
--      one worker wins. Replaces the previous "two API instances both pick the
--      same batch and double-book" failure mode without needing Redis.
-- =============================================================================

-- pgcrypto provides gen_random_uuid() on PostgreSQL < 13; on 13+ it's a
-- built-in but the extension remains a no-op so this is safe to run anywhere.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.txn_shipments
    ADD COLUMN IF NOT EXISTS idempotency_key UUID;

UPDATE public.txn_shipments
SET idempotency_key = gen_random_uuid()
WHERE idempotency_key IS NULL;

ALTER TABLE public.txn_shipments
    ALTER COLUMN idempotency_key SET NOT NULL,
    ALTER COLUMN idempotency_key SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS ix_uq_txn_shipments_idempotency_key
    ON public.txn_shipments (idempotency_key);

ALTER TABLE public.txn_shipments
    ADD COLUMN IF NOT EXISTS last_status_event_at TIMESTAMPTZ;

ALTER TABLE public.txn_shipments
    ADD COLUMN IF NOT EXISTS retry_claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_shipments_retry_claimed_at
    ON public.txn_shipments (retry_claimed_at);
