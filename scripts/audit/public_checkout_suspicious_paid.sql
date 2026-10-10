-- =============================================================================
-- public_checkout_suspicious_paid.sql
-- Checkout and webhook lockdown (roadmap 4.5), decision 12 — READ-ONLY report
-- =============================================================================
-- Lists PAID public-checkout records (plans and products) that show any sign of
-- the pre-4.5 client-trusted checkout being abused. It changes nothing; Accounts
-- reviews each row.
--
-- "Public checkout" = payment_source 'PAYMENT_GATEWAY' with no admin creator
-- (created_by IS NULL). Admin-created payment links always carry created_by.
--
-- Reason codes:
--   NO_GATEWAY_PAYMENT_ID        PAID without a gateway payment id.
--   DISCOUNT_WITHOUT_VALID_PROMO discount > 0 but no promo code, or the code
--                                does not exist in txn_promo_codes.
--   DISCOUNT_EXCEEDS_PROMO       the code exists but the discount is larger
--                                than that code could give (FLAT value, or
--                                PERCENT of the pre-discount amount, capped at
--                                max_discount), + 0.01.
--   NO_MASTER_PRICE              no plan fee / product price for the record's
--                                plan or variant in its currency.
--   PRICE_NOT_MASTER             plans: order_amount != plan fee (± 0.01).
--                                products: a line's amount matches the variant
--                                price neither tax-exclusive nor tax-inclusive
--                                (product prices are stored tax-inclusive).
--   TOTAL_INCONSISTENT           total != order - discount + tax (plans ± 0.01;
--                                products ± 0.01 per line + 0.01).
--   DUPLICATE_GATEWAY_ORDER      the gateway order id is on more than one
--                                active plan/product record.
--
-- Not detectable here: before 4.5 the client could also send gateway_order_id /
-- gateway_payment_id / transaction_id, so a forged PAID row with plausible fake
-- ids passes every check above (only reuse shows as DUPLICATE_GATEWAY_ORDER).
-- Before treating rows as clean, reconcile gateway_payment_id against the
-- Razorpay settlement / payments export for the same period.
--
-- Known false positives: plan fees have no price history, so a fee changed
-- after the sale shows PRICE_NOT_MASTER; product prices are matched within
-- valid_from/valid_to where set.
--
-- Run (CSV for Accounts):
--   psql "$DB_URL" -X -A -F ',' --pset footer=off \
--     -f scripts/audit/public_checkout_suspicious_paid.sql > suspicious_paid.csv
-- =============================================================================

BEGIN TRANSACTION READ ONLY;

WITH dup_gateway_orders AS (
    SELECT gateway_order_id
    FROM (
        SELECT gateway_order_id FROM public.txn_member_payments
        WHERE active AND gateway_order_id IS NOT NULL
        UNION ALL
        SELECT gateway_order_id FROM public.txn_member_products
        WHERE active AND gateway_order_id IS NOT NULL
    ) all_orders
    GROUP BY gateway_order_id
    HAVING COUNT(*) > 1
),
plan_rows AS (
    SELECT
        'PLAN'::text                         AS record_type,
        p.member_payment_id                  AS record_id,
        p.member_id,
        p.franchise_id,
        p.invoice_id,
        p.currency,
        p.order_amount,
        p.discount_amount,
        p.tax_amount,
        p.total_amount,
        p.promo_code,
        p.gateway_order_id,
        p.gateway_payment_id,
        p.payment_date::timestamptz          AS payment_date,
        p.created_at,
        p.updated_at,
        fee.fees                             AS master_amount,
        -- The amount a promo is applied to (before discount)
        p.order_amount                       AS promo_base,
        (fee.fees IS NULL)                   AS no_master_price,
        (fee.fees IS NOT NULL AND ABS(p.order_amount - fee.fees) > 0.01) AS price_not_master,
        (ABS(COALESCE(p.total_amount, 0)
             - (COALESCE(p.order_amount, 0) - COALESCE(p.discount_amount, 0) + COALESCE(p.tax_amount, 0))) > 0.01)
                                             AS total_inconsistent
    FROM public.txn_member_payments p
    LEFT JOIN LATERAL (
        SELECT f.fees
        FROM public.mst_program_plan_fees f
        WHERE f.program_plan_id = p.program_plan_id
          AND UPPER(f.currency_code) = UPPER(p.currency)
        ORDER BY f.active DESC NULLS LAST
        LIMIT 1
    ) fee ON TRUE
    WHERE p.active
      AND p.payment_status_id = 1
      AND p.payment_source = 'PAYMENT_GATEWAY'
      AND p.created_by IS NULL
),
product_lines AS (
    SELECT
        i.member_product_id,
        COUNT(*)                                                              AS line_count,
        SUM(i.base_amount * (1 + COALESCE(i.effective_tax_rate, 0) / 100))    AS gross_amount,
        BOOL_OR(NOT EXISTS (
            SELECT 1 FROM public.mst_product_prices pp
            WHERE pp.product_variant_id = i.product_variant_id
              AND UPPER(pp.currency) = UPPER(mp.currency)
        ))                                                                    AS any_line_no_price,
        BOOL_OR(NOT EXISTS (
            SELECT 1 FROM public.mst_product_prices pp
            WHERE pp.product_variant_id = i.product_variant_id
              AND UPPER(pp.currency) = UPPER(mp.currency)
              AND (pp.valid_from IS NULL OR pp.valid_from <= mp.created_at)
              -- An end date before the start (the admin stores an empty "valid to" as
              -- 1970-01-01) means no end date
              AND (pp.valid_to IS NULL OR pp.valid_to < pp.valid_from
                   OR pp.valid_to <= DATE '1970-01-01' OR pp.valid_to >= mp.created_at)
              AND (
                    ABS(i.base_amount - pp.price * i.quantity) <= 0.01
                 OR ABS(i.base_amount * (1 + COALESCE(i.effective_tax_rate, 0) / 100) - pp.price * i.quantity) <= 0.02
              )
        ))                                                                    AS any_line_off_master
    FROM public.txn_member_product_order_items i
    JOIN public.txn_member_products mp ON mp.member_product_id = i.member_product_id
    GROUP BY i.member_product_id
),
product_rows AS (
    SELECT
        'PRODUCT'::text                      AS record_type,
        m.member_product_id                  AS record_id,
        m.member_id,
        m.franchise_id,
        m.invoice_id,
        m.currency,
        m.sub_total_amount                   AS order_amount,
        m.discount_amount,
        m.tax_amount,
        m.total_amount,
        m.promo_code,
        m.gateway_order_id,
        m.gateway_payment_id,
        m.payment_date,
        m.created_at,
        m.updated_at,
        l.gross_amount                       AS master_amount,
        -- Promos apply to the tax-inclusive subtotal of the variant prices
        l.gross_amount                       AS promo_base,
        (l.member_product_id IS NULL OR l.any_line_no_price) AS no_master_price,
        COALESCE(l.any_line_off_master AND NOT l.any_line_no_price, FALSE) AS price_not_master,
        (ABS(COALESCE(m.total_amount, 0)
             - (COALESCE(m.sub_total_amount, 0) - COALESCE(m.discount_amount, 0) + COALESCE(m.tax_amount, 0)))
            > 0.01 * (COALESCE(l.line_count, 0) + 1)) AS total_inconsistent
    FROM public.txn_member_products m
    LEFT JOIN product_lines l ON l.member_product_id = m.member_product_id
    WHERE m.active
      AND m.payment_status_id = 1
      AND m.payment_source = 'PAYMENT_GATEWAY'
      AND m.created_by IS NULL
),
paid_rows AS (
    SELECT * FROM plan_rows
    UNION ALL
    SELECT * FROM product_rows
),
flagged AS (
    SELECT
        r.*,
        pc.promo_code_id,
        ARRAY_REMOVE(ARRAY[
            CASE WHEN NULLIF(TRIM(r.gateway_payment_id), '') IS NULL THEN 'NO_GATEWAY_PAYMENT_ID' END,
            CASE WHEN COALESCE(r.discount_amount, 0) > 0 AND pc.promo_code_id IS NULL
                 THEN 'DISCOUNT_WITHOUT_VALID_PROMO' END,
            CASE WHEN COALESCE(r.discount_amount, 0) > 0 AND pc.promo_code_id IS NOT NULL
                  AND r.discount_amount > LEAST(
                        CASE pc.discount_type
                            WHEN 'FLAT' THEN pc.discount_value
                            ELSE COALESCE(r.promo_base, 0) * pc.discount_value / 100
                        END,
                        COALESCE(pc.max_discount, 'Infinity'::numeric),
                        COALESCE(r.promo_base, 0)
                      ) + 0.01
                 THEN 'DISCOUNT_EXCEEDS_PROMO' END,
            CASE WHEN r.no_master_price THEN 'NO_MASTER_PRICE' END,
            CASE WHEN r.price_not_master THEN 'PRICE_NOT_MASTER' END,
            CASE WHEN r.total_inconsistent THEN 'TOTAL_INCONSISTENT' END,
            CASE WHEN d.gateway_order_id IS NOT NULL THEN 'DUPLICATE_GATEWAY_ORDER' END
        ], NULL) AS reasons
    FROM paid_rows r
    LEFT JOIN public.txn_promo_codes pc ON UPPER(pc.code) = UPPER(NULLIF(TRIM(r.promo_code), ''))
    LEFT JOIN dup_gateway_orders d ON d.gateway_order_id = r.gateway_order_id
)
SELECT
    f.record_type,
    f.record_id,
    f.member_id,
    TRIM(CONCAT(mem.first_name, ' ', mem.last_name)) AS member_name,
    mem.email_id                                    AS member_email,
    fr.franchise_code,
    fr.company_name                                 AS franchise_name,
    f.invoice_id,
    f.currency,
    f.master_amount,
    f.order_amount,
    f.discount_amount,
    f.promo_code,
    f.tax_amount,
    f.total_amount,
    f.gateway_order_id,
    f.gateway_payment_id,
    ARRAY_TO_STRING(f.reasons, ' ')                 AS reason_codes,
    f.payment_date,
    f.created_at,
    f.updated_at
FROM flagged f
LEFT JOIN public.txn_members mem ON mem.member_id = f.member_id
LEFT JOIN public.mst_franchises fr ON fr.franchise_id = f.franchise_id
WHERE CARDINALITY(f.reasons) > 0
ORDER BY f.created_at, f.record_type, f.record_id;

COMMIT;
