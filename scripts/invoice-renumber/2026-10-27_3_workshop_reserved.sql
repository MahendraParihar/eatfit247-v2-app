-- =============================================================================
-- 2026-10-27_3_workshop_reserved.sql
-- Gives the three 11 Aug 2026 workshop invoices the numbers reserved for them on
-- 26 Oct (bkp_20261026_invoice_reserved: EFM/2627/S/... slots 1-3).
-- Replaces server_1/scripts/workshop-invoice-renumber.ts for this rollout: the
-- 26 Oct resequencing already left the gap, so NOTHING is shifted by +3.
-- =============================================================================
-- Before: migration 151 is applied, the workshop feature is live, and the admin
-- has created the three workshop invoices as PENDING, invoice date and supply
-- date 11 Aug 2026, with bill-to and payment details (spec decision 14).
--
-- Pass the three workshop_invoice_id values in invoice order (200, 200, 174
-- participants) and the admin who approves the run:
--   psql "$DB_URL" -X -v ON_ERROR_STOP=1 -v w1=<id> -v w2=<id> -v w3=<id> -v admin_id=<admin> \
--        [-v apply=1] -f 2026-10-27_3_workshop_reserved.sql
-- DRY RUN BY DEFAULT (rolled back); add -v apply=1 to commit. Refuses to run
-- twice (the reserved numbers are then used).
--
-- Each invoice gets its reserved number, PAID and the production SAC
-- (DIET_SAC_CODE, decision 9). Every change is logged in
-- txn_invoice_renumber_log. The counter is not touched (it already counts the
-- reserved numbers).
-- =============================================================================

\set ON_ERROR_STOP on

\if :{?w1}
\else
\echo 'Pass -v w1=<id> -v w2=<id> -v w3=<id> -v admin_id=<admin>'
\quit
\endif

BEGIN;

CREATE TEMP TABLE tmp_ws_input ON COMMIT DROP AS
SELECT slot, workshop_invoice_id
FROM (VALUES (1, :'w1'::INTEGER), (2, :'w2'::INTEGER), (3, :'w3'::INTEGER)) v(slot, workshop_invoice_id);

CREATE TEMP TABLE tmp_ws_admin ON COMMIT DROP AS
SELECT :'admin_id'::INTEGER AS admin_id;

LOCK TABLE public.txn_workshop_invoices, public.mst_invoice_sequences IN SHARE ROW EXCLUSIVE MODE;

DO
$$
DECLARE
    bad TEXT;
BEGIN
    IF to_regclass('public.bkp_20261026_invoice_reserved') IS NULL THEN
        RAISE EXCEPTION 'workshop: bkp_20261026_invoice_reserved not found (run the 26 Oct resequencing first)';
    END IF;
    IF (SELECT count(DISTINCT workshop_invoice_id) FROM tmp_ws_input) <> 3 THEN
        RAISE EXCEPTION 'workshop: w1, w2 and w3 must be three different invoices';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.mst_admin_users WHERE admin_id = (SELECT admin_id FROM tmp_ws_admin)) THEN
        RAISE EXCEPTION 'workshop: admin_id not found';
    END IF;
    IF (SELECT count(*) FROM public.bkp_20261026_invoice_reserved WHERE used_at IS NULL) <> 3 THEN
        RAISE EXCEPTION 'workshop: the reserved numbers are already used';
    END IF;
    IF NULLIF(trim((SELECT config_value FROM public.mst_configs WHERE config_name = 'DIET_SAC_CODE')), '') IS NULL THEN
        RAISE EXCEPTION 'workshop: mst_configs DIET_SAC_CODE is not set';
    END IF;

    SELECT string_agg('workshop invoice ' || i.workshop_invoice_id || ': ' || concat_ws('; ',
               CASE WHEN w.workshop_invoice_id IS NULL THEN 'not found' END,
               CASE WHEN f.franchise_code IS DISTINCT FROM 'EFMUM' THEN 'not EFMUM' END,
               CASE WHEN NOT w.active THEN 'cancelled' END,
               CASE WHEN w.invoice_id IS NOT NULL THEN 'already numbered ' || w.invoice_id END,
               CASE WHEN w.payment_status_id <> 2 THEN 'not PENDING' END,
               CASE WHEN w.invoice_date <> DATE '2026-08-11' THEN 'invoice date ' || w.invoice_date END,
               CASE WHEN w.payment_mode_id IS NULL OR NULLIF(trim(w.transaction_id), '') IS NULL OR w.payment_date IS NULL
                        THEN 'payment mode / reference / date missing' END), ' | ')
    INTO bad
    FROM tmp_ws_input i
             LEFT JOIN public.txn_workshop_invoices w ON w.workshop_invoice_id = i.workshop_invoice_id
             LEFT JOIN public.mst_franchises f ON f.franchise_id = w.franchise_id
    WHERE w.workshop_invoice_id IS NULL
       OR f.franchise_code IS DISTINCT FROM 'EFMUM'
       OR NOT w.active
       OR w.invoice_id IS NOT NULL
       OR w.payment_status_id <> 2
       OR w.invoice_date <> DATE '2026-08-11'
       OR w.payment_mode_id IS NULL OR NULLIF(trim(w.transaction_id), '') IS NULL OR w.payment_date IS NULL;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'workshop: %', bad;
    END IF;

    -- The reserved numbers must still be free everywhere
    SELECT string_agg(r.invoice_id, ', ')
    INTO bad
    FROM public.bkp_20261026_invoice_reserved r
    WHERE EXISTS (SELECT 1 FROM public.txn_member_payments p WHERE p.invoice_id = r.invoice_id)
       OR EXISTS (SELECT 1 FROM public.txn_member_products m WHERE m.invoice_id = r.invoice_id)
       OR EXISTS (SELECT 1 FROM public.txn_workshop_invoices w WHERE w.invoice_id = r.invoice_id);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'workshop: reserved numbers already in use: %', bad;
    END IF;
END
$$;

CREATE TEMP TABLE tmp_ws_run ON COMMIT DROP AS
SELECT gen_random_uuid() AS run_id;

CREATE TEMP TABLE tmp_ws_map ON COMMIT DROP AS
SELECT i.workshop_invoice_id, r.invoice_id AS new_invoice_id, r.slot
FROM tmp_ws_input i
         JOIN public.bkp_20261026_invoice_reserved r ON r.slot = i.slot;

UPDATE public.txn_workshop_invoices w
SET invoice_id        = m.new_invoice_id,
    payment_status_id = 1,
    sac_code          = (SELECT trim(config_value) FROM public.mst_configs WHERE config_name = 'DIET_SAC_CODE'),
    modified_by       = (SELECT admin_id FROM tmp_ws_admin),
    modified_ip       = 'script:2026-10-27_3',
    updated_at        = CURRENT_TIMESTAMP
FROM tmp_ws_map m
WHERE w.workshop_invoice_id = m.workshop_invoice_id;

INSERT INTO public.txn_invoice_renumber_log
(run_id, table_name, row_id, old_invoice_id, new_invoice_id, reason, created_by, modified_by, created_ip, modified_ip)
SELECT (SELECT run_id FROM tmp_ws_run), 'txn_workshop_invoices', m.workshop_invoice_id, NULL, m.new_invoice_id,
       'Workshop invoice dated 11 Aug 2026: number reserved by the 26 Oct 2026 FY 2026-27 resequencing',
       a.admin_id, a.admin_id, 'script:2026-10-27_3', 'script:2026-10-27_3'
FROM tmp_ws_map m
         CROSS JOIN tmp_ws_admin a;

UPDATE public.bkp_20261026_invoice_reserved r
SET used_table = 'txn_workshop_invoices', used_row_id = m.workshop_invoice_id, used_at = now()
FROM tmp_ws_map m
WHERE m.new_invoice_id = r.invoice_id;

\echo '=== Workshop invoices ==='
SELECT w.workshop_invoice_id, w.invoice_id, w.invoice_date, w.quantity, w.total_amount, w.payment_status_id, w.sac_code
FROM public.txn_workshop_invoices w
         JOIN tmp_ws_map m ON m.workshop_invoice_id = w.workshop_invoice_id
ORDER BY w.invoice_id;

\if :{?apply}
COMMIT;
\echo 'APPLIED: committed.'
\else
ROLLBACK;
\echo 'DRY RUN: rolled back, nothing changed. Re-run with -v apply=1 to apply.'
\endif
