-- =============================================================================
-- 140_tax_engine_correctness.sql
-- Tax-engine correctness (roadmap 4.6), schema
-- =============================================================================
--   1. tax_mode + EXPORT_OF_GOODS
--      Exports of goods by an Indian franchise (MEMUM). EXPORT_OF_SERVICE and
--      EXPORT_OF_GOODS cover both the LUT (0%) and the IGST-paid case;
--      is_lut_applied tells them apart.
--
--   2. mst_tax_master.tax_category
--      STANDARD | ZERO_RATED | EXEMPT | OUT_OF_SCOPE (UAE VAT categories S/Z/E/O).
--      VAT: a rate above 0% is STANDARD; a 0% rule is ZERO_RATED, EXEMPT or
--      OUT_OF_SCOPE. Existing 0% VAT rules (HCUAE's AE service rule) become
--      ZERO_RATED.
--
--   3. mst_franchise_luts
--      Letter of Undertaking register: ARN, financial year, validity. The LUT
--      valid on the supply date decides 0% export vs IGST-paid export, and its
--      ARN is stored on the payment. mst_franchises.lut_number is no longer read;
--      a non-empty value is copied in as a row for Finance to complete (dates).
--
--   4. payment_route + remittance_reference (plans and product orders)
--      How the money arrived. A service export by an Indian franchise needs
--      foreign money: INTERNATIONAL_CARD_GATEWAY, FOREIGN_REMITTANCE (SWIFT with
--      FIRC), RUPEE_VOSTRO or NRE_FCNR_ACCOUNT. DOMESTIC (incl. NRO) is not.
--
--   5. The tax decision stored with each payment / order line:
--      tax_category, lut_arn, tax_decision_reason.
--
--   6. RBAC subject FranchiseLut (franchise-scoped). The subject trigger grants
--      it to roles with grant_all_on_new_subject (Super Admin); other roles are
--      granted in the RBAC screens.
--
-- Idempotent: safe to run twice.
-- =============================================================================

ALTER TYPE public.tax_mode ADD VALUE IF NOT EXISTS 'EXPORT_OF_GOODS';

BEGIN;

-- ------------------------------------------------------------ 2. tax_category
ALTER TABLE public.mst_tax_master
    ADD COLUMN IF NOT EXISTS tax_category VARCHAR(20) NOT NULL DEFAULT 'STANDARD';

UPDATE public.mst_tax_master
SET tax_category = 'ZERO_RATED'
WHERE tax_system = 'VAT'
  AND COALESCE(tax_percent, 0) = 0
  AND tax_category = 'STANDARD';

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mst_tax_master_tax_category') THEN
        ALTER TABLE public.mst_tax_master
            ADD CONSTRAINT chk_mst_tax_master_tax_category
                CHECK (tax_category IN ('STANDARD', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE'));
    END IF;
    -- Earlier drafts of this file added a 0%-only check; replace it with the full category/rate rule
    ALTER TABLE public.mst_tax_master DROP CONSTRAINT IF EXISTS chk_mst_tax_master_zero_vat_category;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mst_tax_master_vat_category_rate') THEN
        -- VAT: a rate above 0% is STANDARD; ZERO_RATED / EXEMPT / OUT_OF_SCOPE are 0%; 0% isn't STANDARD
        ALTER TABLE public.mst_tax_master
            ADD CONSTRAINT chk_mst_tax_master_vat_category_rate
                CHECK (tax_system <> 'VAT'
                    OR (COALESCE(tax_percent, 0) > 0 AND tax_category = 'STANDARD')
                    OR (COALESCE(tax_percent, 0) = 0 AND tax_category <> 'STANDARD'));
    END IF;
END
$$;

-- ---------------------------------------------------------------- 3. LUTs
CREATE TABLE IF NOT EXISTS public.mst_franchise_luts
(
    franchise_lut_id SERIAL PRIMARY KEY,
    franchise_id     INTEGER                  NOT NULL REFERENCES public.mst_franchises (franchise_id),
    arn              VARCHAR(30)              NOT NULL,
    -- Indian financial year the LUT covers, e.g. 2026-27
    financial_year   VARCHAR(10)              NOT NULL,
    -- NULL until Finance enters them; a row without dates is never treated as valid
    valid_from       DATE,
    valid_to         DATE,
    active           BOOLEAN                  NOT NULL DEFAULT true,
    created_by       INTEGER REFERENCES public.mst_admin_users (admin_id),
    modified_by      INTEGER REFERENCES public.mst_admin_users (admin_id),
    created_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
    created_ip       VARCHAR(50),
    modified_ip      VARCHAR(50),
    CONSTRAINT chk_mst_franchise_luts_dates CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_uq_mst_franchise_luts_franchise_arn
    ON public.mst_franchise_luts (franchise_id, arn);

CREATE INDEX IF NOT EXISTS idx_mst_franchise_luts_franchise_validity
    ON public.mst_franchise_luts (franchise_id, valid_from, valid_to)
    WHERE active;

INSERT INTO public.mst_franchise_luts (franchise_id, arn, financial_year)
SELECT f.franchise_id,
       upper(trim(f.lut_number)),
       CASE
           WHEN extract(MONTH FROM current_date) >= 4
               THEN extract(YEAR FROM current_date)::INT || '-' || right((extract(YEAR FROM current_date)::INT + 1)::TEXT, 2)
           ELSE (extract(YEAR FROM current_date)::INT - 1) || '-' || right(extract(YEAR FROM current_date)::INT::TEXT, 2)
           END
FROM public.mst_franchises f
-- Only values shaped like an LUT ARN; free text stays in lut_number for Finance to re-enter
WHERE upper(trim(f.lut_number)) ~ '^AD[0-9A-Z]{13}$'
ON CONFLICT (franchise_id, arn) DO NOTHING;

-- ----------------------------------------------------------- 4. payment route
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_route') THEN
        CREATE TYPE public.payment_route AS ENUM (
            'DOMESTIC',
            'INTERNATIONAL_CARD_GATEWAY',
            'FOREIGN_REMITTANCE',
            'RUPEE_VOSTRO',
            'NRE_FCNR_ACCOUNT'
            );
    END IF;
END
$$;

ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS payment_route        public.payment_route,
    ADD COLUMN IF NOT EXISTS remittance_reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tax_category         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS lut_arn              VARCHAR(30),
    ADD COLUMN IF NOT EXISTS tax_decision_reason  VARCHAR(255);

ALTER TABLE public.txn_member_products
    ADD COLUMN IF NOT EXISTS payment_route        public.payment_route,
    ADD COLUMN IF NOT EXISTS remittance_reference VARCHAR(100);

ALTER TABLE public.txn_member_product_order_items
    ADD COLUMN IF NOT EXISTS tax_category        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS lut_arn             VARCHAR(30),
    ADD COLUMN IF NOT EXISTS tax_decision_reason VARCHAR(255);

-- ------------------------------------------------------------------ 6. RBAC
INSERT INTO public.mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('FranchiseLut', 'Franchise LUT register', true)
ON CONFLICT (subject_code) DO NOTHING;

COMMIT;
