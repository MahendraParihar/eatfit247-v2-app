-- =============================================================================
-- 141_exchange_rates.sql
-- Tax-engine correctness (roadmap 4.6), group 9: exchange rates
-- =============================================================================
--   1. mst_exchange_rates
--      One row per (rate date, from currency, to currency, source). `rate` is the
--      amount of `to_currency` for 1 unit of `from_currency`. Sources:
--        FBIL          INR reference rates (RBI-designated), fetched daily; services
--        CBUAE_PEG     the UAE Central Bank's official USD peg (1 USD = 3.6725 AED)
--        CBIC_CUSTOMS  customs notified rates for goods, entered by Finance
--                      fortnightly (valid_to = end of the notified period)
--        MANUAL        entered by Finance from the official page (note required)
--
--   2. FX saved on each invoice when it is issued (principle 1): the rate, its
--      date and source, the franchise's functional currency (INR / AED) and the
--      total and tax in that currency. NULL rate on a foreign-currency invoice =
--      "FX pending" until the daily job finds the rate.
--
--   3. RBAC subject ExchangeRate (global, not franchise-scoped).
--
-- mst_currency_configs (seeded USD→INR = 1, never read) is superseded; left as is.
-- Idempotent: safe to run twice.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.mst_exchange_rates
(
    exchange_rate_id SERIAL PRIMARY KEY,
    rate_date        DATE                     NOT NULL,
    from_currency    VARCHAR(3)               NOT NULL,
    to_currency      VARCHAR(3)               NOT NULL,
    rate             NUMERIC(18, 8)           NOT NULL CHECK (rate > 0),
    source           VARCHAR(20)              NOT NULL
        CHECK (source IN ('FBIL', 'CBUAE_PEG', 'CBIC_CUSTOMS', 'MANUAL')),
    -- Customs rates apply for a notified period; others apply from rate_date until a newer rate
    valid_to         DATE,
    note             VARCHAR(255),
    active           BOOLEAN                  NOT NULL DEFAULT true,
    created_by       INTEGER REFERENCES public.mst_admin_users (admin_id),
    modified_by      INTEGER REFERENCES public.mst_admin_users (admin_id),
    created_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
    created_ip       VARCHAR(50),
    modified_ip      VARCHAR(50),
    CONSTRAINT chk_mst_exchange_rates_pair CHECK (from_currency <> to_currency),
    CONSTRAINT chk_mst_exchange_rates_valid_to CHECK (valid_to IS NULL OR valid_to >= rate_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_uq_mst_exchange_rates_date_pair_source
    ON public.mst_exchange_rates (rate_date, from_currency, to_currency, source);

CREATE INDEX IF NOT EXISTS idx_mst_exchange_rates_pair_date
    ON public.mst_exchange_rates (from_currency, to_currency, rate_date DESC)
    WHERE active;

-- The AED has been pegged to the USD at 3.6725 by the UAE Central Bank since 1997
INSERT INTO public.mst_exchange_rates (rate_date, from_currency, to_currency, rate, source, note)
VALUES ('1997-11-01', 'USD', 'AED', 3.67250000, 'CBUAE_PEG', 'UAE Central Bank official USD peg')
ON CONFLICT (rate_date, from_currency, to_currency, source) DO NOTHING;

ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS fx_rate                 NUMERIC(18, 8),
    ADD COLUMN IF NOT EXISTS fx_rate_date            DATE,
    ADD COLUMN IF NOT EXISTS fx_source               VARCHAR(20),
    ADD COLUMN IF NOT EXISTS functional_currency     VARCHAR(3),
    ADD COLUMN IF NOT EXISTS functional_total_amount NUMERIC(14, 3),
    ADD COLUMN IF NOT EXISTS functional_tax_amount   NUMERIC(14, 3);

ALTER TABLE public.txn_member_products
    ADD COLUMN IF NOT EXISTS fx_rate                 NUMERIC(18, 8),
    ADD COLUMN IF NOT EXISTS fx_rate_date            DATE,
    ADD COLUMN IF NOT EXISTS fx_source               VARCHAR(20),
    ADD COLUMN IF NOT EXISTS functional_currency     VARCHAR(3),
    ADD COLUMN IF NOT EXISTS functional_total_amount NUMERIC(14, 3),
    ADD COLUMN IF NOT EXISTS functional_tax_amount   NUMERIC(14, 3);

-- Invoices still waiting for a rate (the daily job backfills them)
CREATE INDEX IF NOT EXISTS idx_txn_member_payments_fx_pending
    ON public.txn_member_payments (member_payment_id)
    WHERE invoice_id IS NOT NULL AND functional_currency IS NOT NULL AND fx_rate IS NULL;

CREATE INDEX IF NOT EXISTS idx_txn_member_products_fx_pending
    ON public.txn_member_products (member_product_id)
    WHERE invoice_id IS NOT NULL AND functional_currency IS NOT NULL AND fx_rate IS NULL;

INSERT INTO public.mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('ExchangeRate', 'Exchange rates', false)
ON CONFLICT (subject_code) DO NOTHING;

COMMIT;
