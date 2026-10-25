-- =============================================================================
-- 143_payment_mode_routes.sql
-- Tax-engine correctness (roadmap 4.6), group 12: payment mode decides the route
-- =============================================================================
-- Owner feedback: "payment mode" and "how the money arrived" are one question.
-- Each payment mode now carries the payment route the tax decision uses for an
-- offline payment (IGST Act s.2(6)(iv): exports need foreign money):
--   DOMESTIC                    UPI, NEFT, RTGS, IMPS, cash, cheque, Indian cards…
--   INTERNATIONAL_CARD_GATEWAY  PayPal; "International card (e-FIRA)"
--   FOREIGN_REMITTANCE          "Foreign bank transfer (SWIFT)"
--   NRE_FCNR_ACCOUNT            "NRE / FCNR account"
--   RUPEE_VOSTRO                "Special Rupee Vostro account"
-- Run after 140 (payment_route type). Idempotent.
-- =============================================================================

BEGIN;

ALTER TABLE public.mst_payment_modes
    ADD COLUMN IF NOT EXISTS payment_route public.payment_route NOT NULL DEFAULT 'DOMESTIC';

-- PayPal stopped domestic Indian payments in 2021: its receipts come from abroad (FIRC available)
UPDATE public.mst_payment_modes
SET payment_route = 'INTERNATIONAL_CARD_GATEWAY'
WHERE lower(payment_mode) = 'paypal'
  AND payment_route = 'DOMESTIC';

INSERT INTO public.mst_payment_modes (payment_mode, payment_route, active, created_by, modified_by)
SELECT m.payment_mode, m.payment_route::public.payment_route, true, 1, 1
FROM (VALUES ('Foreign bank transfer (SWIFT)', 'FOREIGN_REMITTANCE'),
             ('International card (e-FIRA)', 'INTERNATIONAL_CARD_GATEWAY'),
             ('NRE / FCNR account', 'NRE_FCNR_ACCOUNT'),
             ('Special Rupee Vostro account', 'RUPEE_VOSTRO')) AS m(payment_mode, payment_route)
WHERE NOT EXISTS (SELECT 1 FROM public.mst_payment_modes p WHERE lower(p.payment_mode) = lower(m.payment_mode));

COMMIT;
