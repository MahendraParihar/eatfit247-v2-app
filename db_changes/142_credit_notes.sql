-- =============================================================================
-- 142_credit_notes.sql
-- Tax-engine correctness (roadmap 4.6), group 10: Tax Credit Notes
-- =============================================================================
--   1. txn_credit_notes
--      A credit note against an issued tax invoice (plan payment or product order).
--      4.6 enables it for VAT franchises (UAE "Tax Credit Note", Executive
--      Regulation Art 60); Indian GST credit notes reuse it in roadmap 4.9.
--      Amounts are positive and reverse the original's VAT at its rate and
--      category; FX is copied from the original invoice. late_issue flags a note
--      issued more than 14 days after the event.
--
--   2. txn_credit_note_items: the credited lines.
--
--   3. Numbering: mst_invoice_sequences rows with invoice_type 'credit'
--      ({code}/{FY}/CN/{seq}), gap-free per franchise and FY, issued in the
--      creating transaction.
--
--   4. RBAC subject CreditNote (franchise-scoped).
--
-- Credit notes are never deleted or edited (principle 10). Idempotent.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.txn_credit_notes
(
    credit_note_id          SERIAL PRIMARY KEY,
    franchise_id            INTEGER        NOT NULL REFERENCES public.mst_franchises (franchise_id),
    member_id               INTEGER        NOT NULL REFERENCES public.txn_members (member_id),
    member_payment_id       INTEGER REFERENCES public.txn_member_payments (member_payment_id),
    member_product_id       INTEGER REFERENCES public.txn_member_products (member_product_id),
    original_invoice_id     VARCHAR(100)   NOT NULL,
    original_invoice_date   DATE,
    credit_note_number      VARCHAR(100)   NOT NULL,
    credit_note_date        DATE           NOT NULL,
    event_date              DATE           NOT NULL,
    reason                  VARCHAR(500)   NOT NULL,
    currency                VARCHAR(3)     NOT NULL,
    taxable_amount          NUMERIC(14, 3) NOT NULL,
    tax_amount              NUMERIC(14, 3) NOT NULL,
    total_amount            NUMERIC(14, 3) NOT NULL CHECK (total_amount > 0),
    tax_type                VARCHAR(20),
    tax_category            VARCHAR(20),
    tax_percentage          NUMERIC(5, 2),
    fx_rate                 NUMERIC(18, 8),
    fx_rate_date            DATE,
    fx_source               VARCHAR(20),
    functional_currency     VARCHAR(3),
    functional_total_amount NUMERIC(14, 3),
    functional_tax_amount   NUMERIC(14, 3),
    late_issue              BOOLEAN        NOT NULL DEFAULT false,
    active                  BOOLEAN        NOT NULL DEFAULT true,
    created_by              INTEGER REFERENCES public.mst_admin_users (admin_id),
    modified_by             INTEGER REFERENCES public.mst_admin_users (admin_id),
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_ip              VARCHAR(50),
    modified_ip             VARCHAR(50),
    CONSTRAINT chk_txn_credit_notes_one_source CHECK (
        (member_payment_id IS NOT NULL)::INT + (member_product_id IS NOT NULL)::INT = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_uq_txn_credit_notes_number
    ON public.txn_credit_notes (credit_note_number);

CREATE INDEX IF NOT EXISTS idx_txn_credit_notes_payment
    ON public.txn_credit_notes (member_payment_id)
    WHERE member_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_txn_credit_notes_product
    ON public.txn_credit_notes (member_product_id)
    WHERE member_product_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.txn_credit_note_items
(
    credit_note_item_id SERIAL PRIMARY KEY,
    credit_note_id      INTEGER        NOT NULL REFERENCES public.txn_credit_notes (credit_note_id),
    description         VARCHAR(255)   NOT NULL,
    taxable_amount      NUMERIC(14, 3) NOT NULL,
    tax_percentage      NUMERIC(5, 2),
    tax_amount          NUMERIC(14, 3) NOT NULL,
    total_amount        NUMERIC(14, 3) NOT NULL,
    active              BOOLEAN        NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_txn_credit_note_items_note
    ON public.txn_credit_note_items (credit_note_id);

INSERT INTO public.mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('CreditNote', 'Tax credit notes', true)
ON CONFLICT (subject_code) DO NOTHING;

COMMIT;
