# Plan: Checkout and Webhook Lockdown (roadmap 4.5)

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> This feature touches **payments**. Implement **one group at a time** and commit between groups. If review finds a gap, add a new group here rather than patching silently.

## Group 1: Shared Library

- [x] 1.1 Add the public interfaces (`core/public-checkout.interface.ts`):
  - `IPublicPlanOrderRequest`: programPlanId, currency, addressId, billingAddressId, gstNumber?, promoCode?, franchisePaymentGatewayId?
  - `IPublicProductOrderRequest`: items (productId, productVariantId, quantity), currency, addressId, billingAddressId, gstNumber?, promoCode?, franchisePaymentGatewayId?
  - `IPublicCheckoutOrderResponse`: `recordId`, `paymentStatusId`, `breakdown` (`IPublicCheckoutPricedBreakdown`, with per-line `items` for products), `gateway` (`IPublicCheckoutGatewayPayload`: gatewayCode, gatewayOrderId, keyId, amount, amountMinor, currency, customer, notes)
  - reCAPTCHA stays in the `X-Recaptcha-Token` header (that is what `RecaptchaGuard` reads), so it is not a body field. The website currently also sends `recaptchaToken` in the body; group 5 must drop it, or the whitelisted DTOs from 4.1 will return 400.
- [x] 1.2 The public plan tax calculation takes `promoCode?` instead of `discountAmount`. It uses the new **public-only** `IPublicPlanTaxCalculationRequest` and `IPublicPlanTaxCalculationResponse` (this extends `ICalculateTaxResponse` with `promoCode` and `promoMessage`; `discountAmount` is inherited). `IPlanTaxCalculationRequest` is shared with the admin calculate-tax route, so it stays unchanged ("admin interfaces are unchanged").
- [x] 1.3 Add `GatewayEventResultEnum`: APPLIED, IGNORED_DUPLICATE, IGNORED_STATE, ORDER_NOT_FOUND, ERROR (string values).
- [x] 1.4 Add a currency minor-unit helper: `CurrencyUtil.exponent` / `toMinor` / `fromMinor`, using an ISO-4217 exponent map (unknown codes use 2 decimals, an invalid code throws).
- [x] 1.5 `npm run build`, then commit.

## Group 2: Database

- [ ] 2.1 `db_changes/<next>_payment_gateway_events.sql`. Take the next free number after those reserved by 4.7 (137 and 138).
  - Create `txn_payment_gateway_events` with: id, provider, event_id, event_type, gateway_order_id, gateway_payment_id, amount, currency, signature_valid, payload JSONB, result, message, member_payment_id NULL, member_product_id NULL, received_at, and the audit columns.
  - Add a unique index on `(provider, event_id)`.
- [ ] 2.2 Add `franchise_payment_gateway_id` to `txn_member_payments` and `txn_member_products` if it doesn't exist.
- [ ] 2.3 Allow NULL in `payment_date` on both tables. Check the current constraint first.
- [ ] 2.4 Add the models, apply the migration locally, and commit.

## Group 3: Confirmation service and webhook (`server_1`)

- [ ] 3.1 Add `PaymentConfirmationService.confirmGatewayPayment({ provider, gatewayOrderId, gatewayPaymentId, capturedAt, amountMinor, currency })`. In one transaction:
  1. Find the plan or product record by gateway order id, `FOR UPDATE`.
  2. Apply the state matrix: PENDING or FAILED → PAID; anything else → IGNORED_STATE.
  3. Check the amount and currency against the stored total (using the minor-unit helper).
  4. Set PAID, `payment_date` (capture time; franchise-local date once 4.7 exists) and `gateway_payment_id`.
  5. Issue the invoice number using the existing `generateInvoiceNumber`.
  6. Increment the promo `used_count` and flag the event if the code is over its limit.
  7. Commit, then emit the paid event.

  Return the result enum.
- [ ] 3.2 Webhook controller:
  1. Verify the signature.
  2. Insert the event (on a duplicate, return 200 with IGNORED_DUPLICATE).
  3. Route the event:
     - `payment.captured`, `order.paid`, `payment_link.paid` → `confirmGatewayPayment`
     - `payment.failed` → PENDING→FAILED only
     - `payment_link.partially_paid`, `cancelled` or `expired` → log only
     - `payment.refunded` and `refund.created` → store `refundObj` as today, with no status change
  4. Update the event result.

  Replace every hard-coded `/100` with the minor-unit helper.
- [ ] 3.3 Unit tests:
  - state matrix (every pair)
  - duplicate event id
  - captured and order.paid racing (the second one is IGNORED_STATE, with only one invoice number)
  - late failed after PAID → ignored
  - amount mismatch → ERROR and no PAID
  - 0- and 3-decimal currencies
  - promo usage incremented once
  - over-limit promo flagged
- [ ] 3.4 Update `razorpay-webhook.controller.spec.ts`. Lint, test and build, then commit.

## Group 4: Order-first public checkout

- [ ] 4.1 Replace `CreatePublicCheckoutPlanOrderDto` and `CreatePublicCheckoutOrderDto` with whitelisted DTOs that implement the new interfaces, with no money-state fields. Confirm the `ValidationPipe` has `whitelist` and `forbidNonWhitelisted` on public-api (add it at controller level if the global setting differs).
- [ ] 4.2 Plan `POST …/order`:
  1. Validate the member against the checkout token.
  2. Price from the program plan fee in the requested currency, plus `applyPromoCode` (400 if invalid), plus tax (the existing `calculatePaymentObject`).
  3. Create the PENDING record with source PAYMENT_GATEWAY and a NULL payment date.
  4. Resolve the gateway (existing logic) and create the gateway order for the stored total.
  5. Store `gateway_order_id`, provider and `franchise_payment_gateway_id`.
  6. Return `IPublicCheckoutOrderResponse`.

  Do it all in one transaction. If the gateway call fails, roll back.
- [ ] 4.3 Product `POST …/product/order`: same approach, priced from `mst_product_prices` for each variant and currency, plus promo and per-line tax (existing code).
- [ ] 4.4 `verify-payment` (plan and product):
  1. Look up the record by `orderId` for that member.
  2. Verify the signature with the record's stored gateway.
  3. Fetch the payment from the gateway API (status and amount).
  4. If captured, call `confirmGatewayPayment` and return the record's status.
  5. Otherwise return `verified: false` with the status.
- [ ] 4.5 `payment-order` and `payment-link` public endpoints: drop `amount`. Either remove them, if the website doesn't use them (open question), or make them take a PENDING record id and use its stored total.
- [ ] 4.6 Plan tax-calculation endpoint: accept `promoCode` and apply it on the server.
- [ ] 4.7 Diet-plan gate (decision 11): find the server-side check that blocks diet-plan work before payment. Make sure it requires a PAID payment, not just an existing row. Fix it if needed and add a test.
- [ ] 4.8 Unit tests:
  - a client-sent `paymentStatusId` gets 400
  - pricing comes from master data, not the client
  - an invalid promo gets 400
  - gateway order amount = stored total
  - verify with a forged signature → not verified
  - verify with an uncaptured payment → stays PENDING
- [ ] 4.9 Lint, test and build, then commit.

## Group 5: Website checkout (`eatfit247-web-1`)

- [ ] 5.1 `checkout.service.ts` / `payment.service.ts`:
  - call `…/order` **before** opening the gateway, with the new request
  - use the returned gateway payload to open Razorpay
  - remove the post-payment create call
  - after success, call `verify-payment` and route on the returned status
- [ ] 5.2 Promo field in the checkout summary (Material form field): apply it through the tax-calculation endpoint, show the discount or the error message, and send `promoCode` with the order.
- [ ] 5.3 Success page: read status from the server (the existing `checkout/order/:gatewayOrderId` endpoints). Show a "payment processing" state while the status is PENDING and verify didn't confirm it.
- [ ] 5.4 `npx nx build` (SSR). Manual flow in Razorpay test mode. Commit.

## Group 6: Suspicious-records report

- [ ] 6.1 `scripts/audit/public_checkout_suspicious_paid.sql`, a read-only query (decision 12) covering plans and products, with member, franchise, invoice, amounts, the reason codes, and created/updated times.
- [ ] 6.2 Run it on a production copy. Share the CSV with the owner and Accounts. Commit the SQL only.

## Group 7: Close-out

- [ ] 7.1 Every check in `validation.md` passes.
- [ ] 7.2 Set `requirements.md` status to Shipped. Mark roadmap 4.5 ✅ with a link.
- [ ] 7.3 Replan notes:
  - The state matrix and confirmation service become the contract for 8.1 (Telr) and 8.2 (Stripe).
  - 4.9 picks up refund events from `txn_payment_gateway_events`.
