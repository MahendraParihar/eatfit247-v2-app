# Validation: Checkout and Webhook Lockdown (roadmap 4.5)

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given a valid checkout token, when a client posts `…/order` including `paymentStatusId`, `paymentSource`, `paymentDate`, `discountAmount` or an amount, then the API returns 400 and creates nothing | unit + curl | ✅ DTO spec against the real pipe options (10 money fields → 400); live: client `discountAmount` → 400. The HTTP order route is reCAPTCHA-guarded first |
| A2 | Given a valid plan order request, then a PENDING record is created and priced from the plan fee + validated promo + tax, the Razorpay order amount equals the stored total, and the response carries the gateway payload | unit + curl + Razorpay dashboard | ✅ unit + live: PENDING row 4743/4744 priced from fee + promo + tax; Razorpay test order = stored total (106200 paise for ₹1,062) |
| A3 | Same as A2 for a product order (price from `mst_product_prices`) | unit + curl | ✅ unit (pricing) + live: PENDING product order, gateway order = stored total; only active, currently valid prices (8.2) |
| A4 | Given a PENDING record, when no payment happens, then it stays PENDING with no invoice number (the proforma is downloadable once 4.7 ships) | manual + SQL | ✅ live: an abandoned PENDING row keeps NULL `payment_date` and no invoice (proforma once 4.7 ships) |
| A5 | Given a successful test-mode payment, when `verify-payment` is called, then the server fetches the payment from Razorpay, sets PAID, sets `payment_date` and `gateway_payment_id`, and issues exactly one invoice number | unit + manual | ✅ browser (Razorpay test mode): verify fetched the payment and set PAID, `payment_date`, `gateway_payment_id` and invoice `…/S/000004`, once |
| A6 | Given A5 already happened, when `payment.captured` and `order.paid` webhooks arrive (also simulated in parallel), then both are logged, one or both show IGNORED_STATE, and no second invoice number is consumed | unit + manual replay | ✅ unit + live: parallel captured + order.paid → one APPLIED, one IGNORED_STATE, one invoice number |
| A7 | Given a PAID record, when a late `payment.failed` arrives, then the status stays PAID and the event is logged IGNORED_STATE | unit + manual replay | ✅ unit + live: late `payment.failed` → IGNORED_STATE, status stays PAID |
| A8 | Given a webhook with an event id already stored, when it is replayed, then it returns 200 with IGNORED_DUPLICATE and changes nothing | unit + manual | ✅ unit + live: replayed event id → 200 IGNORED_DUPLICATE; in-flight redelivery → 409 (8.4) |
| A9 | Given a captured amount that differs from the stored total, then the record is not marked PAID and the event is ERROR with a message | unit | ✅ unit + live: amount mismatch → ERROR with message, stays PENDING |
| A10 | Given `verify-payment` with a forged signature or an uncaptured payment, then the record stays PENDING and the response is `verified: false` | unit + curl | ✅ unit + live: forged signature, and a valid signature for an unknown payment → `verified: false`, PENDING |
| A11 | Given a valid promo code, when it is applied at checkout, then the discount shows before payment and is stored on the record, and `used_count` goes up by exactly 1 when the order becomes PAID (not at PENDING) | unit + manual + SQL | ✅ browser + SQL: discount shown before payment, stored on the record; `used_count` 0 → 1 only at PAID |
| A12 | Given an invalid, expired, below-minimum or exhausted promo, then tax calculation and order creation return 400 with the reason | unit + manual | ✅ live: invalid, expired, below-minimum, exhausted and inactive codes → 400 with the reason (plan and product tax, order) |
| A13 | Given amounts in a 0-decimal or 3-decimal currency, then the conversion uses the right exponent | unit | ✅ unit: JPY (0), KWD (3), USD/INR (2) |
| A14 | Given a PENDING checkout record, then diet-plan work for that payment is blocked until it becomes PAID | unit + manual (admin) | ✅ unit + live service check: blocked while PENDING, allowed once PAID (manage, update-details, send-email). Admin UI not clicked |
| A15 | Given a refund webhook, then it is logged and `refundObj` stored, and the status and invoice are unchanged | unit | ✅ unit: refund logged, `refundObj` stored, status and invoice unchanged; refunds only grow (8.5) |
| A16 | Given the website, when a customer completes checkout (plan and product, INR and one foreign currency) in Razorpay test mode, then the success page shows the paid order from the server | manual (browser; Safari + mobile width) | ◐ Chrome, Razorpay test mode: plan INR (record 4744) and product INR (order 46) both paid, and the success page shows PAID from the server. **Still needed:** a foreign currency (no non-INR gateway is configured; promos are INR-only, 9.1), Safari, mobile width (the automated window resize had no effect) |
| A17 | Given the suspicious-records SQL, when run on a production copy, then it lists rows with reason codes, changes no data, and its output is shared with the owner and Accounts | manual | ◐ written; local run plus a rolled-back test with one crafted row per reason code passed. **Still needed:** a production-copy run, gateway reconciliation (8.8), and sharing with the owner and Accounts |
| A19 | Given an admin creates a Payment-Gateway payment (plan or product), then the record is saved PENDING first, the link is for its stored total, status/date/ids can't be set or edited by the admin, an open link's amount can't change, and Cancel/Regenerate cancel the old link at Razorpay | unit + admin browser + Razorpay test | ✅ plan dialog in Chrome (payment 5115); regenerate, cancel and paid-link webhook live; product create and cancel live (order 47) |
| A18 | Given admin manual payment entry, then admins can still record offline PAID payments as before (regression) | manual (admin) | ✅ live: admin manual PAID payment for 4945 → invoice `…/S/000005`, as before |

## Post-ship (owner, after merge into `m3-cms-update`)

These need production data, a non-INR gateway, or devices the agent can't reach. They are tracked here, not hidden:

- [ ] Apply `db_changes/139_payment_gateway_events.sql` on a production copy, then production (re-running it is safe).
- [ ] A17: run `scripts/audit/public_checkout_suspicious_paid.sql` on production and reconcile `gateway_payment_id` against the Razorpay settlement export. Share it with the owner and then Accounts.
- [ ] Review `scripts/audit/payment_gateway_event_exceptions.sql` daily for the first weeks (ERROR, ORDER_NOT_FOUND, over-limit promo, unfinished events).
- [ ] A16 remainder: Safari, mobile width, and a foreign-currency checkout once a non-INR gateway exists (promos are INR-only until promo codes get a currency).
- [ ] Watch the first real webhooks in `txn_payment_gateway_events` (localhost can't receive them).
- [x] Cancel the test NimbusPost shipment booked from local testing: shipment 37, AWB 4152922405330 (cancelled by the owner, 2026-10-10).

## Automated Checks

- [x] `cd shared-library && npm run build`
- [x] `cd server_1`: `nx build` for public-api and admin-api passes; jest passes for member (9 suites, 113 tests) and pocket-guide. **lint:** no `lint` target exists and the eslintrc ignores `libs/`, so it couldn't run. Already failing before 4.5: core `AbilitiesGuard` spec (1 test), platform `google.service.spec` (doesn't load)
- [x] `cd eatfit247-web-1 && npx nx build` (SSR). ESLint on the changed files: no new problems (10 errors and 6 warnings, all already there; it ran with `@nx/enforce-module-boundaries` off, because that rule hangs building the project graph)
- [x] New or updated specs pass: `payment-confirmation.service.spec.ts` (state matrix, races, amounts, promo), `razorpay-webhook.controller.spec.ts`, public checkout controller/DTO specs, minor-unit helper spec
- [ ] The event-log migration applies on a fresh DB and on a copy of production. *Applied locally and re-runs cleanly. Also applied twice to a scratch clone reverted to its pre-139 state (table, both columns on both tables, nullable `payment_date`); the clone was dropped. A production copy is still needed*
- [ ] **When roadmap 5.3/5.4 land, add:**
  - integration tests for order → webhook → PAID, and for duplicate and late events
  - Playwright e2e for website checkout with Razorpay test mode

## Manual Checks

```bash
# A1: must return 400
curl -s -X POST "$PUBLIC_API/checkout/plan/member/$MEMBER_ID/order" \
  -H "x-checkout-token: $TOKEN" -H 'content-type: application/json' \
  -d '{"programPlanId":1,"currency":"INR","addressId":1,"billingAddressId":1,"paymentStatusId":1}'
```

```sql
-- Events per result (after the test run)
SELECT event_type, result, count(*) FROM txn_payment_gateway_events GROUP BY 1, 2 ORDER BY 1, 2;
-- One invoice per paid gateway order (expect no rows)
SELECT gateway_order_id, count(DISTINCT invoice_id) FROM txn_member_payments
WHERE gateway_order_id IS NOT NULL GROUP BY 1 HAVING count(DISTINCT invoice_id) > 1;
```

- [ ] Razorpay test mode (*plan INR paid in Chrome; webhook flows replayed with signed requests, since Razorpay can't reach localhost*):
  - plan INR, plan USD, product INR
  - a failed payment
  - a closed modal (abandoned)
  - replay events from the Razorpay dashboard
- [ ] Website: promo applied, then removed; invalid promo; success page during a delayed webhook (*applied ✅, removed ✅ and invalid ✅ in Chrome; the delayed-webhook PENDING state is covered by code and SSR, not clicked*)
- [x] Admin: record a manual PAID payment (A18): service-level, the admin create path is unchanged
- [ ] Suspicious-records report run and shared (A17)

## Review

- [x] Diff reviewed at the requirements level: two independent subagent reviews; fixes in plan Groups 8–10
- [x] Deep review by subagents (payment bypass, races, idempotency, franchise leakage, conventions). Findings fixed or logged: plan.md Group 8
- [x] Specs and code in sync: each group's "As built" notes in plan.md
- [ ] I can explain the change (state matrix tests, confirmation service) — owner sign-off
