-- =============================================================================
-- payment_gateway_event_exceptions.sql
-- Checkout and webhook lockdown (roadmap 4.5) — READ-ONLY daily check
-- =============================================================================
-- Gateway events that need a person to look at them. These return 200 to the
-- gateway (a retry would not change the outcome), so nothing else alerts on them:
--   ERROR             amount/currency mismatch (money may be captured while the
--                     record stays PENDING, e.g. an admin payment link whose amount
--                     differs from the stored total), or a duplicated order id.
--   ORDER_NOT_FOUND   a paid gateway order with no record.
--   promo_over_limit  a paid order whose promo code was already at its usage limit.
--   NULL result       processing never finished (crash) and no redelivery fixed it.
--
-- Run:
--   psql "$DB_URL" -X -A -F ',' --pset footer=off \
--     -v since="'$(date -v-7d +%F)'" -f scripts/audit/payment_gateway_event_exceptions.sql
-- (without -v since, the last 7 days are used)
-- =============================================================================

\if :{?since}
\else
  \set since 'now() - interval ''7 days'''
\endif

BEGIN TRANSACTION READ ONLY;

SELECT
    e.received_at,
    e.provider,
    e.event_type,
    e.event_id,
    CASE
        WHEN e.result IS NULL AND e.received_at < now() - interval '15 minutes' THEN 'UNFINISHED'
        WHEN e.promo_over_limit THEN 'PROMO_OVER_LIMIT'
        ELSE e.result
    END                                      AS exception,
    e.message,
    e.gateway_order_id,
    e.gateway_payment_id,
    e.amount,
    e.currency,
    e.member_payment_id,
    e.member_product_id,
    COALESCE(p.payment_status_id, m.payment_status_id) AS record_status_id,
    COALESCE(p.total_amount, m.total_amount)           AS record_total
FROM public.txn_payment_gateway_events e
LEFT JOIN public.txn_member_payments p ON p.member_payment_id = e.member_payment_id
LEFT JOIN public.txn_member_products m ON m.member_product_id = e.member_product_id
WHERE e.active
  AND e.received_at >= :since
  AND (
        e.result IN ('ERROR', 'ORDER_NOT_FOUND')
     OR e.promo_over_limit
     OR (e.result IS NULL AND e.received_at < now() - interval '15 minutes')
  )
ORDER BY e.received_at;

COMMIT;
