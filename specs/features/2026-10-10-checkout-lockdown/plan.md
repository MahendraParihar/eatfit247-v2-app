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

- [x] 2.1 `db_changes/139_payment_gateway_events.sql` (137 and 138 are reserved by 4.7).
  - Creates `txn_payment_gateway_events` with: id, provider, event_id, event_type, gateway_order_id, gateway_payment_id, amount (major units, NUMERIC(14,3)), currency, signature_valid, payload JSONB, result (NULL while processing; a CHECK limits it to the enum values), message, `promo_over_limit` (the flag from 3.1 step 6), member_payment_id NULL, member_product_id NULL, received_at, and the audit columns.
  - Adds a unique index on `(provider, event_id)`, plus lookup indexes on the event's gateway_order_id and its linked records.
  - Adds partial indexes on `gateway_order_id` in both payment tables, for the webhook and verify lookups. They are not unique, because decision 12 expects existing duplicates.
- [x] 2.2 Add `franchise_payment_gateway_id` (FK to `mst_franchise_payment_gateway`) to `txn_member_payments` and `txn_member_products`. Neither table had it.
- [x] 2.3 `txn_member_payments.payment_date` had NOT NULL, which is now dropped. `txn_member_products.payment_date` already allowed NULL.
- [x] 2.4 Models: new `TxnPaymentGatewayEvent` (member module, registered), `franchisePaymentGatewayId` added to both payment models, and `TxnMemberPayment.paymentDate` is now `Date | null`. Applied locally; re-running the migration is safe. Committed.
  - Note for group 3: Sequelize returns DECIMAL as a string (e.g. `amount` = `"1499.500"`), so wrap it in `Number()` before comparing.

## Group 3: Confirmation service and webhook (`server_1`)

- [x] 3.1 Add `PaymentConfirmationService.confirmGatewayPayment({ provider, gatewayOrderId, gatewayPaymentId, capturedAt, amountMinor, currency })`. In one transaction:
  1. Find the plan or product record by gateway order id, `FOR UPDATE`.
  2. Apply the state matrix: PENDING or FAILED → PAID; anything else → IGNORED_STATE.
  3. Check the amount and currency against the stored total (using the minor-unit helper).
  4. Set PAID, `payment_date` (capture time; franchise-local date once 4.7 exists) and `gateway_payment_id`.
  5. Issue the invoice number using the existing `generateInvoiceNumber`.
  6. Increment the promo `used_count` and flag the event if the code is over its limit.
  7. Commit, then emit the paid event.

  Return the result enum.
- [x] 3.2 Webhook controller:
  1. Verify the signature.
  2. Insert the event (on a duplicate, return 200 with IGNORED_DUPLICATE).
  3. Route the event:
     - `payment.captured`, `order.paid`, `payment_link.paid` → `confirmGatewayPayment`
     - `payment.failed` → PENDING→FAILED only
     - `payment_link.partially_paid`, `cancelled` or `expired` → log only
     - `payment.refunded` and `refund.created` → store `refundObj` as today, with no status change
  4. Update the event result.

  Replace every hard-coded `/100` with the minor-unit helper.
- [x] 3.3 Unit tests:
  - state matrix (every pair)
  - duplicate event id
  - captured and order.paid racing (the second one is IGNORED_STATE, with only one invoice number)
  - late failed after PAID → ignored
  - amount mismatch → ERROR and no PAID
  - 0- and 3-decimal currencies
  - promo usage incremented once
  - over-limit promo flagged
- [x] 3.4 Update `razorpay-webhook.controller.spec.ts`. Lint, test and build, then commit.
- **As built (group 3):**
  - `PaymentConfirmationService` (member module) also covers `markGatewayPaymentFailed` (PENDING→FAILED only), `recordGatewayRefund` (stores `refundObj` with no status change) and `findRecordRef`. It looks in both tables by gateway order id, locking with `FOR UPDATE`. Two matching rows return ERROR.
  - Plan PAID now emits a new `order.plan.paid` event after commit. No listener exists yet; products keep `order.product.paid`.
  - `RazorpayWebhookService` handles the event log and routing; the controller keeps only raw-body and signature checks. The event id comes from `x-razorpay-event-id` (or a sha256 of the raw body if that header is missing). The stored and routed payload is the signed raw body.
  - Invalid-signature requests are **not** stored: an unsigned caller could otherwise claim a real event id ahead of Razorpay and turn the genuine event into a "duplicate". So `signature_valid` is always true for now.
  - A redelivered event whose stored result is ERROR or NULL (crashed mid-way) is processed again on the same row. APPLIED, IGNORED_STATE and ORDER_NOT_FOUND count as final.
  - Amount and currency mismatches and ORDER_NOT_FOUND return 200 with the result logged, because a gateway retry wouldn't change them. Unexpected exceptions return 5xx so Razorpay retries.
  - `payment_link.cancelled` and `expired` no longer set FAILED; they are logged only (plan 3.2 and decision 10).
  - Promo: a new controller-free `PromoCodeServiceModule`, because importing `PromoCodeModule` into the member module would mount the admin promo controller on public-api. `PromoCodeService.recordUsage` locks the code row.
  - `RazorpayService.createOrder` always created **INR** orders (it dropped the currency), and both it and `createPaymentLink` hard-coded `* 100`. Both now pass the currency and use `CurrencyUtil.toMinor`.
  - Checks: member jest passes (4 suites, 65 tests); both apps pass type checks and `nx build`; the live HTTP test covers the race, duplicate, late failure, mismatch, FAILED→PAID, bad signature and over-limit promo cases.
  - Lint can't run: there is no `lint` target for the member project, and the eslintrc ignore patterns cover `libs/`. The platform jest suite already fails before this change (`google.service.spec`: `InputLengthEnum` undefined).

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
- [ ] 4.7a `payment_date` NULL audit: server_1 has `strictNullChecks` off, so the compiler won't flag the roughly 58 server reads of `paymentDate`. Before PENDING public records (with NULL payment date) can exist, check the reports, invoice/FY logic, the admin payment list/detail and the emails for NULL handling.
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
