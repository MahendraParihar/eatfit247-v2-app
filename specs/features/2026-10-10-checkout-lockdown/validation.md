# Validation: Checkout and Webhook Lockdown (roadmap 4.5)

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given a valid checkout token, when a client posts `…/order` including `paymentStatusId`, `paymentSource`, `paymentDate`, `discountAmount` or an amount, then the API returns 400 and creates nothing | unit + curl | ☐ |
| A2 | Given a valid plan order request, then a PENDING record is created and priced from the plan fee + validated promo + tax, the Razorpay order amount equals the stored total, and the response carries the gateway payload | unit + curl + Razorpay dashboard | ☐ |
| A3 | Same as A2 for a product order (price from `mst_product_prices`) | unit + curl | ☐ |
| A4 | Given a PENDING record, when no payment happens, then it stays PENDING with no invoice number (the proforma is downloadable once 4.7 ships) | manual + SQL | ☐ |
| A5 | Given a successful test-mode payment, when `verify-payment` is called, then the server fetches the payment from Razorpay, sets PAID, sets `payment_date` and `gateway_payment_id`, and issues exactly one invoice number | unit + manual | ☐ |
| A6 | Given A5 already happened, when `payment.captured` and `order.paid` webhooks arrive (also simulated in parallel), then both are logged, one or both show IGNORED_STATE, and no second invoice number is consumed | unit + manual replay | ☐ |
| A7 | Given a PAID record, when a late `payment.failed` arrives, then the status stays PAID and the event is logged IGNORED_STATE | unit + manual replay | ☐ |
| A8 | Given a webhook with an event id already stored, when it is replayed, then it returns 200 with IGNORED_DUPLICATE and changes nothing | unit + manual | ☐ |
| A9 | Given a captured amount that differs from the stored total, then the record is not marked PAID and the event is ERROR with a message | unit | ☐ |
| A10 | Given `verify-payment` with a forged signature or an uncaptured payment, then the record stays PENDING and the response is `verified: false` | unit + curl | ☐ |
| A11 | Given a valid promo code, when it is applied at checkout, then the discount shows before payment and is stored on the record, and `used_count` goes up by exactly 1 when the order becomes PAID (not at PENDING) | unit + manual + SQL | ☐ |
| A12 | Given an invalid, expired, below-minimum or exhausted promo, then tax calculation and order creation return 400 with the reason | unit + manual | ☐ |
| A13 | Given amounts in a 0-decimal or 3-decimal currency, then the conversion uses the right exponent | unit | ☐ |
| A14 | Given a PENDING checkout record, then diet-plan work for that payment is blocked until it becomes PAID | unit + manual (admin) | ☐ |
| A15 | Given a refund webhook, then it is logged and `refundObj` stored, and the status and invoice are unchanged | unit | ☐ |
| A16 | Given the website, when a customer completes checkout (plan and product, INR and one foreign currency) in Razorpay test mode, then the success page shows the paid order from the server | manual (browser; Safari + mobile width) | ☐ |
| A17 | Given the suspicious-records SQL, when run on a production copy, then it lists rows with reason codes, changes no data, and its output is shared with the owner and Accounts | manual | ☐ |
| A18 | Given admin manual payment entry, then admins can still record offline PAID payments as before (regression) | manual (admin) | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-web-1 && npx nx build` (SSR)
- [ ] New or updated specs pass: `payment-confirmation.service.spec.ts` (state matrix, races, amounts, promo), `razorpay-webhook.controller.spec.ts`, public checkout controller/DTO specs, minor-unit helper spec
- [ ] The event-log migration applies on a fresh DB and on a copy of production
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

- [ ] Razorpay test mode:
  - plan INR, plan USD, product INR
  - a failed payment
  - a closed modal (abandoned)
  - replay events from the Razorpay dashboard
- [ ] Website: promo applied, then removed; invalid promo; success page during a delayed webhook
- [ ] Admin: record a manual PAID payment (A18)
- [ ] Suspicious-records report run and shared (A17)

## Review

- [ ] Diff reviewed at the requirements level
- [ ] Deep review by subagents (payment bypass, races, idempotency, franchise leakage, conventions). Findings fixed or logged
- [ ] Specs and code in sync
- [ ] I can explain the change (state matrix tests, confirmation service)
