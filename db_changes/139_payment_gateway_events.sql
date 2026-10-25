-- =============================================================================
-- 139_payment_gateway_events.sql
-- Checkout and webhook lockdown (roadmap 4.5)
-- =============================================================================
--   1. txn_payment_gateway_events
--      Append-only log of every payment-gateway webhook event. The webhook
--      inserts the event first; the unique (provider, event_id) index makes a
--      redelivered event short-circuit as IGNORED_DUPLICATE. `result` is NULL
--      while the event is being processed and is then set to one of
--      GatewayEventResultEnum. `promo_over_limit` flags a paid order whose promo
--      code had already reached its usage limit (the payment is still accepted).
--
--   2. franchise_payment_gateway_id on txn_member_payments / txn_member_products
--      The gateway chosen when the PENDING record was created, reused to verify
--      the payment with the same credentials.
--
--   3. checkout_session_id on txn_member_payments / txn_member_products
--      The checkout token (jti) that created a public-checkout record. Public
--      invoice downloads require the same session, because a checkout token can
--      be obtained by anyone who knows a member's email or phone.
--
--   4. txn_member_payments.payment_date accepts NULL
--      A public-checkout record is created PENDING before the customer pays;
--      payment_date is set from the gateway capture time when it becomes PAID.
--      (txn_member_products.payment_date is already nullable.)
--
-- Numbers 137 and 138 are reserved by feature 2026-10-10-invoice-number-non-gst.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.txn_payment_gateway_events
(
    payment_gateway_event_id BIGSERIAL PRIMARY KEY,
    provider                 VARCHAR(20)              NOT NULL,
    event_id                 VARCHAR(100)             NOT NULL,
    event_type               VARCHAR(100)             NOT NULL,
    gateway_order_id         VARCHAR(100),
    gateway_payment_id       VARCHAR(100),
    -- Major units of `currency` (converted from the gateway's minor units)
    amount                   NUMERIC(14, 3),
    currency                 VARCHAR(3),
    signature_valid          BOOLEAN                  NOT NULL,
    payload                  JSONB                    NOT NULL,
    result                   VARCHAR(30),
    message                  TEXT,
    promo_over_limit         BOOLEAN                  NOT NULL DEFAULT false,
    member_payment_id        INTEGER REFERENCES public.txn_member_payments (member_payment_id),
    member_product_id        INTEGER REFERENCES public.txn_member_products (member_product_id),
    received_at              TIMESTAMPTZ              NOT NULL DEFAULT now(),
    active                   BOOLEAN                  NOT NULL DEFAULT true,
    created_by               INTEGER,
    modified_by              INTEGER,
    created_at               TIMESTAMPTZ              NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ              NOT NULL DEFAULT now(),
    created_ip               VARCHAR(50),
    modified_ip              VARCHAR(50),
    CONSTRAINT chk_txn_payment_gateway_events_result CHECK (
        result IS NULL
            OR result IN ('APPLIED', 'IGNORED_DUPLICATE', 'IGNORED_STATE', 'ORDER_NOT_FOUND', 'ERROR')
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_uq_txn_payment_gateway_events_provider_event
    ON public.txn_payment_gateway_events (provider, event_id);

CREATE INDEX IF NOT EXISTS idx_txn_payment_gateway_events_order
    ON public.txn_payment_gateway_events (gateway_order_id);

CREATE INDEX IF NOT EXISTS idx_txn_payment_gateway_events_member_payment
    ON public.txn_payment_gateway_events (member_payment_id)
    WHERE member_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_txn_payment_gateway_events_member_product
    ON public.txn_payment_gateway_events (member_product_id)
    WHERE member_product_id IS NOT NULL;

ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS franchise_payment_gateway_id INTEGER
        REFERENCES public.mst_franchise_payment_gateway (franchise_payment_gateway_id);

ALTER TABLE public.txn_member_products
    ADD COLUMN IF NOT EXISTS franchise_payment_gateway_id INTEGER
        REFERENCES public.mst_franchise_payment_gateway (franchise_payment_gateway_id);

ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(64);

ALTER TABLE public.txn_member_products
    ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(64);

-- The webhook and verify paths look records up by gateway order id.
CREATE INDEX IF NOT EXISTS idx_txn_member_payments_gateway_order
    ON public.txn_member_payments (gateway_order_id)
    WHERE gateway_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_txn_member_products_gateway_order
    ON public.txn_member_products (gateway_order_id)
    WHERE gateway_order_id IS NOT NULL;

ALTER TABLE public.txn_member_payments
    ALTER COLUMN payment_date DROP NOT NULL;

COMMIT;
