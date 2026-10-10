-- =============================================================================
-- preview_fy2026_27_q2.sql — READ-ONLY preview of db_changes/138
-- Invoice series (roadmap 4.7). Changes nothing.
-- =============================================================================
-- Part 1 lists every FY 2026-27 invoice of EFMUM / MEMUM dated on or after
-- 1 July 2026 with its resolved billing country, tax, stored tax mode, derived
-- series and old → new number, exactly as 138 would assign them, plus a
-- `blocks_138` column naming any guard that row would trip (138 aborts if any
-- row has one). Part 2 lists FY 2026-27 numbers 138 cannot classify (also abort).
-- The classification block is copied verbatim from 138.
--
-- Run (CSV for Accounts' sign-off):
--   psql "$DB_URL" -X -q --csv \
--     -f scripts/invoice-renumber/preview_fy2026_27_q2.sql > invoice_renumber_preview.csv
-- =============================================================================

BEGIN TRANSACTION READ ONLY;

-- Part 1: the renumbering
WITH rows_138 AS (
-- BEGIN CLASSIFICATION
WITH franchises AS (
    SELECT franchise_id, franchise_code, time_zone
    FROM public.mst_franchises
    WHERE franchise_code IN ('EFMUM', 'MEMUM')
),
invoiced AS (
    SELECT 'txn_member_payments'::TEXT AS source_table,
           p.member_payment_id         AS pk,
           f.franchise_id,
           f.franchise_code,
           'service'::TEXT             AS invoice_type,
           'S'::TEXT                   AS type_code,
           p.payment_date::DATE        AS local_payment_date,
           p.created_at,
           p.invoice_id,
           p.invoice_series,
           p.invoice_date,
           p.tax_amount,
           p.tax_mode::TEXT            AS tax_mode,
           p.active,
           p.payment_status_id,
           p.member_id,
           p.member_address
    FROM public.txn_member_payments p
             JOIN franchises f ON f.franchise_id = p.franchise_id
    WHERE p.invoice_id IS NOT NULL
      AND (p.invoice_id LIKE f.franchise_code || '/2026-27/%' OR p.invoice_id LIKE f.franchise_code || '/EXP/2026-27/%')
    UNION ALL
    SELECT 'txn_member_products',
           m.member_product_id,
           f.franchise_id,
           f.franchise_code,
           'product',
           'P',
           (m.payment_date AT TIME ZONE f.time_zone)::DATE,
           m.created_at,
           m.invoice_id,
           m.invoice_series,
           m.invoice_date,
           m.tax_amount,
           NULL,
           m.active,
           m.payment_status_id,
           m.member_id,
           m.member_address
    FROM public.txn_member_products m
             JOIN franchises f ON f.franchise_id = m.franchise_id
    WHERE m.invoice_id IS NOT NULL
      AND (m.invoice_id LIKE f.franchise_code || '/2026-27/%' OR m.invoice_id LIKE f.franchise_code || '/EXP/2026-27/%')
),
billing AS (
    -- JSON null is not SQL NULL: only an object counts as an address
    SELECT i.*,
           CASE
               WHEN jsonb_typeof(i.member_address -> 'billingAddress') = 'object' THEN i.member_address -> 'billingAddress'
               WHEN jsonb_typeof(i.member_address -> 'address') = 'object' THEN i.member_address -> 'address'
               END AS billing_json
    FROM invoiced i
),
resolved AS (
    SELECT b.*,
           COALESCE(
                   NULLIF(upper(trim(b.billing_json ->> 'countryCode')), ''),
                   (SELECT NULLIF(upper(trim(c.country_code)), '')
                    FROM public.mst_countries c
                    WHERE c.country_id::TEXT = b.billing_json ->> 'countryId'
                    LIMIT 1),
                   (SELECT NULLIF(upper(trim(c.country_code)), '')
                    FROM public.mst_countries c
                    WHERE lower(trim(c.country)) = lower(trim(b.billing_json ->> 'country'))
                    LIMIT 1)
           ) AS billing_country
    FROM billing b
)
SELECT r.source_table,
       r.pk,
       r.franchise_id,
       r.franchise_code,
       r.invoice_type,
       r.type_code,
       r.local_payment_date,
       r.created_at,
       r.invoice_id                                AS old_invoice_id,
       r.invoice_series                            AS old_invoice_series,
       r.invoice_date                              AS old_invoice_date,
       r.tax_amount,
       r.tax_mode,
       r.active,
       r.payment_status_id,
       r.member_id,
       r.billing_country,
       (r.local_payment_date >= DATE '2026-07-01') AS in_window,
       CASE
           WHEN r.billing_country IS NOT NULL AND r.billing_country <> 'IN' AND COALESCE(r.tax_amount, 0) = 0
               THEN 'EXPORT'
           ELSE 'DOMESTIC'
           END                                     AS series
FROM resolved r
-- END CLASSIFICATION
),
q1_max AS (
    SELECT franchise_id, invoice_type, max(substring(old_invoice_id FROM '(\d{6})$')::INTEGER) AS q1_max
    FROM rows_138
    WHERE NOT in_window
    GROUP BY franchise_id, invoice_type
),
base AS (
    SELECT f.franchise_id,
           t.invoice_type,
           COALESCE(q.q1_max, 0) AS q1_base
    FROM public.mst_franchises f
             CROSS JOIN (VALUES ('service'), ('product')) t(invoice_type)
             LEFT JOIN q1_max q ON q.franchise_id = f.franchise_id AND q.invoice_type = t.invoice_type
    WHERE f.franchise_code IN ('EFMUM', 'MEMUM')
),
mapped AS (
    SELECT r.*,
           b.q1_base,
           CASE WHEN r.series = 'DOMESTIC' THEN b.q1_base ELSE 0 END
               + row_number() OVER (PARTITION BY r.franchise_id, r.invoice_type, r.series
                                    ORDER BY r.local_payment_date, r.created_at, r.pk) AS new_seq
    FROM rows_138 r
             JOIN base b ON b.franchise_id = r.franchise_id AND b.invoice_type = r.invoice_type
    WHERE r.in_window
)
SELECT m.source_table,
       m.pk,
       m.franchise_code,
       m.invoice_type,
       TRIM(CONCAT(mem.first_name, ' ', mem.last_name)) AS member_name,
       m.local_payment_date                            AS payment_date,
       m.created_at::DATE                              AS created_on,
       m.active,
       ps.payment_status                               AS status,
       COALESCE(m.billing_country, '?')                AS billing_country,
       m.tax_amount,
       m.tax_mode                                      AS stored_tax_mode,
       m.series,
       m.old_invoice_id,
       CASE
           WHEN m.billing_country IS NULL THEN '?'
           ELSE m.franchise_code
                    || CASE WHEN m.series = 'EXPORT' THEN '/EXP' ELSE '' END
                    || '/2026-27/' || m.type_code || '/' || lpad(m.new_seq::TEXT, 6, '0')
           END                                         AS new_invoice_id,
       NULLIF(concat_ws('; ',
                        CASE WHEN m.billing_country IS NULL THEN 'billing country unknown' END,
                        CASE WHEN m.local_payment_date >= DATE '2027-04-01' THEN 'dated FY 2027-28' END,
                        CASE WHEN m.old_invoice_id NOT LIKE '%/EXP/%'
                                  AND substring(m.old_invoice_id FROM '(\d{6})$')::INTEGER < m.q1_base
                                 THEN 'numbered below the highest Q1 number (Q1/Q2 overlap)' END), '') AS blocks_138
FROM mapped m
         LEFT JOIN public.txn_members mem ON mem.member_id = m.member_id
         LEFT JOIN public.mst_payment_status ps ON ps.payment_status_id = m.payment_status_id
ORDER BY m.franchise_code, m.invoice_type, m.series, m.new_seq;

-- Part 2: FY 2026-27 numbers of EFMUM / MEMUM that 138 cannot classify (138 aborts on any)
SELECT t.source_table, t.pk, t.invoice_id, t.franchise_id, f.franchise_code AS row_franchise_code
FROM (SELECT 'txn_member_payments'::TEXT AS source_table, member_payment_id AS pk, invoice_id, franchise_id
      FROM public.txn_member_payments
      WHERE upper(trim(invoice_id)) ~ '^(EFMUM|MEMUM)/(EXP/)?2026-27/'
      UNION ALL
      SELECT 'txn_member_products', member_product_id, invoice_id, franchise_id
      FROM public.txn_member_products
      WHERE upper(trim(invoice_id)) ~ '^(EFMUM|MEMUM)/(EXP/)?2026-27/') t
         LEFT JOIN public.mst_franchises f ON f.franchise_id = t.franchise_id
WHERE f.franchise_code IS NULL
   OR NOT (t.invoice_id LIKE f.franchise_code || '/2026-27/%' OR t.invoice_id LIKE f.franchise_code || '/EXP/2026-27/%')
ORDER BY 1, 2;

COMMIT;
