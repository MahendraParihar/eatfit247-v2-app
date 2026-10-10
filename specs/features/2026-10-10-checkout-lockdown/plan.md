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

- [x] 4.1 Replace `CreatePublicCheckoutPlanOrderDto` and `CreatePublicCheckoutOrderDto` with whitelisted DTOs that implement the new interfaces, with no money-state fields. Confirm the `ValidationPipe` has `whitelist` and `forbidNonWhitelisted` on public-api (add it at controller level if the global setting differs).
- [x] 4.2 Plan `POST …/order`:
  1. Validate the member against the checkout token.
  2. Price from the program plan fee in the requested currency, plus `applyPromoCode` (400 if invalid), plus tax (the existing `calculatePaymentObject`).
  3. Create the PENDING record with source PAYMENT_GATEWAY and a NULL payment date.
  4. Resolve the gateway (existing logic) and create the gateway order for the stored total.
  5. Store `gateway_order_id`, provider and `franchise_payment_gateway_id`.
  6. Return `IPublicCheckoutOrderResponse`.

  Do it all in one transaction. If the gateway call fails, roll back.
- [x] 4.3 Product `POST …/product/order`: same approach, priced from `mst_product_prices` for each variant and currency, plus promo and per-line tax (existing code).
- [x] 4.4 `verify-payment` (plan and product):
  1. Look up the record by `orderId` for that member.
  2. Verify the signature with the record's stored gateway.
  3. Fetch the payment from the gateway API (status and amount).
  4. If captured, call `confirmGatewayPayment` and return the record's status.
  5. Otherwise return `verified: false` with the status.
- [x] 4.5 `payment-order` and `payment-link` public endpoints: drop `amount`. Either remove them, if the website doesn't use them (open question), or make them take a PENDING record id and use its stored total.
- [x] 4.6 Plan tax-calculation endpoint: accept `promoCode` and apply it on the server.
- [x] 4.7 Diet-plan gate (decision 11): find the server-side check that blocks diet-plan work before payment. Make sure it requires a PAID payment, not just an existing row. Fix it if needed and add a test.
- [x] 4.7a `payment_date` NULL audit: server_1 has `strictNullChecks` off, so the compiler won't flag the roughly 58 server reads of `paymentDate`. Before PENDING public records (with NULL payment date) can exist, check the reports, invoice/FY logic, the admin payment list/detail and the emails for NULL handling.
- [x] 4.8 Unit tests:
  - a client-sent `paymentStatusId` gets 400
  - pricing comes from master data, not the client
  - an invalid promo gets 400
  - gateway order amount = stored total
  - verify with a forged signature → not verified
  - verify with an uncaptured payment → stays PENDING
- [x] 4.9 Lint, test and build, then commit.
- **As built (group 4):**
  - 4.1 The global public-api `ValidationPipe` already had `whitelist` + `forbidNonWhitelisted` + `forbidUnknownValues`, so nothing was needed at controller level. New DTOs in `public-checkout.dto.ts`: `PublicPlanOrderDto`, `PublicProductOrderDto`, `PublicPlanTaxCalculationDto`, `PublicProductTaxCalculationDto` and `PublicVerifyPaymentDto`. The old `CreatePublicCheckout*` DTOs and `VerifyPaymentDto` were removed.
  - New `CheckoutGatewayService` (member module), shared by plan and product:
    - `applyPromoCode`: 400 with the promo message; the discount is rounded to the currency and capped at the order amount.
    - `createGatewayOrder`: resolves the gateway, creates the order for the stored total and adds `franchisePaymentGatewayId` to the notes. Only RAZORPAY is allowed; Telr and Stripe return 400 until Phase 8.
    - `verifyAndConfirm`: checks the signature with the record's stored gateway credentials, then `fetchPayment` (new on `RazorpayService` and the adapter). It confirms only if the payment is `captured` and its `order_id` matches. A gateway fetch error comes back as not verified, not 500.
  - The record is created, `reload`ed (so the gateway is charged the DECIMAL-rounded stored total), gets its gateway order, and is committed. Program id stays 1, as the old controller did.
  - The public routes `payment-order` and `payment-link` (plan and product) were **removed**: the website never calls the link endpoints, and `…/order` replaces `payment-order` (open question resolved).
  - New contract in shared-library (beyond group 1): `IPublicVerifyPaymentRequest`/`Response`, and `IPublicProductTaxCalculationRequest`/`Response`, so the public product tax preview also takes `promoCode` instead of a client `discountAmount`.
  - 4.7 There was **no** server-side payment gate at all. `MemberDietPlanService.assertDietPlanPaid` now requires a PAID payment for `manage` (detail create/update), `update-details` (apply template) and send-email. Reads, downloads and deletes are not gated.
  - 4.7a NULL audit: the reports filter on date ranges (so PENDING rows drop out) and the exports already guard. Two fixes: the shared plan invoice mapper called `paymentDate.toString()` (it would crash on a PENDING proforma), and the plan invoice filename used `null`. Admin member lists sort `paymentDate DESC`, so PENDING rows show first.
  - `buildOrderItem` now returns 400 when a variant has no price in the requested currency (it used to throw a TypeError, which surfaced as a 500).
  - Tests: member jest passes (8 suites, 103 tests); both apps pass type checks and builds.
  - Live (member 4945, Razorpay TEST): promo tax preview; invalid promo → 400; client `discountAmount` → 400; order without reCAPTCHA → 400; removed endpoint → 404. The plan order creates a PENDING row and a test Razorpay order for exactly the stored total. A forged verify, and a verify for an unknown payment, both stay PENDING; another member's ID gets 403. The webhook capture sets PAID, the invoice and promo usage, after which verify returns verified=true and the diet gate opens. The product order creates a PENDING row and its gateway order. Test rows were soft-deleted, and three local invoice numbers were used.
  - **Found for 4.6 (not fixed here):**
    - `MemberProductService.calculateOrderItemsTax` passes the franchise and billing addresses to `calculateTax` in swapped order. Domestic results are unchanged, but exports and place of supply are wrong.
    - Product prices are treated as tax-inclusive, so the preview shows an unrounded `orderAmount` (e.g. 2142.857).

## Group 5: Website checkout (`eatfit247-web-1`)

- [x] 5.1 `checkout.service.ts` / `payment.service.ts`:
  - call `…/order` **before** opening the gateway, with the new request
  - use the returned gateway payload to open Razorpay
  - remove the post-payment create call
  - after success, call `verify-payment` and route on the returned status
- [x] 5.2 Promo field in the checkout summary (Material form field): apply it through the tax-calculation endpoint, show the discount or the error message, and send `promoCode` with the order.
- [x] 5.3 Success page: read status from the server (the existing `checkout/order/:gatewayOrderId` endpoints). Show a "payment processing" state while the status is PENDING and verify didn't confirm it.
- [x] 5.4 `npx nx build` (SSR). Manual flow in Razorpay test mode. Commit.
- **As built (group 5):**
  - `checkout.service.ts` and `payment.service.ts` use the public contract (`IPublicPlanOrderRequest`, `IPublicProductOrderRequest`, `IPublicCheckoutOrderResponse`, the public tax request/response types and the verify request/response).
    - The dead `createPaymentLink` (it called a URL that doesn't exist) and the payment-order calls are removed.
    - Razorpay opens with the server's `gatewayOrderId`, `keyId` and `amountMinor`, so no client `* 100`, and its options are now typed (no `any`).
    - reCAPTCHA goes only in the `X-Recaptcha-Token` header.
  - In `checkout.component.ts`, `…/order` runs before the gateway opens. Paying again for the same selection reuses the same PENDING order, compared by request key.
  - After the gateway callback the component calls verify. Either way it routes to the success page; a verify network error is tolerated because the webhook is the backstop.
  - API errors arrive as `{status, message}`, so a helper now shows the server's message (e.g. "Invalid promo code").
  - Promo field: a Material form field in the order summary on the review step, with a discount row. Its state is **signals**, because the app is zoneless and plain fields set after an `await` never re-render (found in browser testing).
  - The success page derives the status from `paymentStatusId`. PENDING shows "Confirming your payment" and polls every 3 s for up to 60 s; FAILED shows "Payment not completed". The invoice download and "Paid" chips appear only when PAID, and the payment date shows only when set.
  - Checks: `nx build` (SSR) passes. ESLint on the changed files is slow; its result is recorded separately.
  - **Manual Razorpay test mode (member 4945, plan 271, Chrome):**
    - Invalid promo → inline "Invalid promo code".
    - `LOCKWEB100` → ₹1,000 − ₹100 + 18% tax = ₹1,062.
    - "Continue to Payment" created PENDING record 4744 and a Razorpay test order for 106200 paise.
    - The payment was completed in the Razorpay popup; verify then set PAID, invoice `EFMUM/2026-27/S/000004` and promo `used_count` 1. No webhook was involved (Razorpay can't reach localhost).
    - The success page shows Paid with the invoice; the admin Payment History for 4945 shows the row as Paid ₹1,062.
  - **Already there, not fixed (UI):**
    - The checkout component (zoneless, plain fields) doesn't re-render after its initial async loads, so the summary shows "0 items" until the user interacts.
    - The page logs `NG0100 ExpressionChangedAfterItHasBeenChecked`.
    - Both happen without these changes. Converting the component's state to signals is a separate fix.

## Group 6: Suspicious-records report

- [x] 6.1 `scripts/audit/public_checkout_suspicious_paid.sql`, a read-only query (decision 12) covering plans and products, with member, franchise, invoice, amounts, the reason codes, and created/updated times.
- [ ] 6.2 Run it on a production copy. Share the CSV with the owner and Accounts. Commit the SQL only.
- **As built (group 6):**
  - The script runs inside `BEGIN TRANSACTION READ ONLY`. It selects "public checkout" rows: PAID, `PAYMENT_GATEWAY`, and `created_by IS NULL` (admin payment links always have a creator).
  - Reason codes: NO_GATEWAY_PAYMENT_ID, DISCOUNT_WITHOUT_VALID_PROMO, DISCOUNT_EXCEEDS_PROMO, NO_MASTER_PRICE, PRICE_NOT_MASTER, TOTAL_INCONSISTENT, DUPLICATE_GATEWAY_ORDER.
  - Price comparisons:
    - Plans compare `order_amount` with the plan fee (fees are tax-exclusive).
    - Product lines match the variant price either tax-exclusive or **tax-inclusive** (product prices are stored including tax), within `valid_from`/`valid_to`.
  - Plan fees have no price history, so a fee changed after a sale is a known false positive. This is noted in the header.
  - Local checks:
    - The real data returns 0 rows; the one public PAID record is the legitimate Razorpay test payment 4744.
    - A rolled-back test with one crafted row per reason code flagged every case and left the clean control unflagged.
- [ ] 6.2 Run it on a production copy and share the CSV with the owner and Accounts. **This is the owner's step:** there is no production copy locally. The command is in the file header (`psql … -A -F ',' -f scripts/audit/public_checkout_suspicious_paid.sql > suspicious_paid.csv`). Open question: should the owner see it before Accounts?

## Group 8: Review fixes (deep review, 2026-10-10)

An independent subagent reviewed the whole diff (`5e9cb61a..06fa02e7`) for payment bypass, races, idempotency, leakage and conventions. It found **no Critical issue**: every public path to PAID, an invoice, a discount or the diet plan goes through `confirmGatewayPayment` after a gateway-confirmed capture. Findings and outcomes:

- [x] 8.1 (Medium) **The promo cap compared strings.** DECIMAL columns arrive as strings, so a FLAT code's `discountAmount > maxDiscount` compared text: `"500.00" > "1000.00"` is true, which **raised** the discount to the cap. This was already in the code and is now reachable from the website. `applyPromoCode` now converts `discountValue`, `maxDiscount` and `minOrderAmount` with `Number()`. The test fails on the old code; live, FLAT 500 with a 1000 cap on a ₹1,000 plan → ₹500 off.
- [x] 8.2 (Medium) **Public product pricing took the first price row**, including inactive or expired ones (removed variants keep their row with inactive prices). The public order and tax preview now use only an active product and an active price valid today (`findSellablePrice`). Admin orders are unchanged.
- [x] 8.3 (Medium) **The over-limit promo flag was lost when verify won the race.** The webhook then saw IGNORED_STATE with no flag. Verify now writes a `txn_payment_gateway_events` row (`event_id = verify:<paymentId>`, `event_type = checkout.verify`) with the result and `promo_over_limit`; a repeat verify hits the unique index and is skipped.
- [x] 8.4 (Low) **Concurrent redelivery ran twice.** A NULL-result row younger than 5 minutes now counts as in flight and gets **409**, not 200, so the gateway retries later: by then the first delivery has finished (the retry is a duplicate) or the row is stale and gets reprocessed. A delivery that dies mid-way is therefore never acknowledged as done. It no longer overwrites APPLIED or resets the flag.
- [x] 8.5 (Low) **The event-id header is not signed**, so a signed body could be replayed under a new id. The state matrix already contains this for PAID/FAILED. Refunds now only grow: an older or replayed refund body can't overwrite a larger stored `refundObj`.
- [x] 8.6 (PII) **The unguarded public lookups by gateway order id returned the whole record**, now including the raw Razorpay entity (email, contact, card). The public `findByGatewayOrderId` (plan and product) now returns `paymentGatewayResponse` and `refundObj` as null; the website doesn't use them.
- [x] 8.7 (Medium) **Admin payment links can get stuck at PENDING.** The admin UI sends the link amount; if it differs from the stored total, the capture is ERROR (200, so no retry). Behaviour matches the old code (which threw and retried forever without success). Added the read-only `scripts/audit/payment_gateway_event_exceptions.sql` (ERROR, ORDER_NOT_FOUND, over-limit promo, unfinished events) for a daily check. Creating admin links from the stored record total is logged for 4.8.
- [x] 8.8 (Medium) **The suspicious report can't catch forged ids.** Before 4.5 the client could post plausible fake gateway ids. The report header now says to reconcile `gateway_payment_id` against the Razorpay settlement/payments export before treating rows as clean (part of 6.2).
- Logged, not fixed in 4.5 (owner decisions or other roadmap items):
  - **Promo codes have no currency.** A FLAT INR code would apply as-is to a USD/AED order, and so would `min_order_amount`/`max_discount`. Only INR gateways are active today, so nothing is exposed yet. Decide before enabling foreign-currency checkout: restrict promos to the default currency, or add a currency column. (Joins the promo-eligibility open question.)
  - Hidden or offline plans can be bought by id (`active` is checked, `isVisibleOnWeb` isn't). The website lists only visible plans.
  - `payment_date` is the payment's `created_at`; Razorpay sends no separate capture time. Usually the same day; the franchise-local date comes with 4.7.
  - The product header total is the rounded sum of unrounded line totals, so it can differ by a few paise (no `roundingAdjustment`). Belongs to 4.6.
  - Abandoned public PENDING records count in the admin dashboard's "pending amount" and each has an empty diet-plan container (accepted under decision 10). Tell Accounts.
  - **(High, already there, outside 4.5) `POST member/create` gives a checkout token to anyone who knows an existing member's email or phone**, and overwrites that profile (including `hasAnyPlan=false`). That token can download the member's invoices. Not a payment bypass, but it needs its own roadmap item.
- Checks: member jest passes (9 suites, 113 tests); both apps pass type checks. Live: promo math, public lookup redaction.

## Group 9: Remaining review findings (2026-10-10)

The items Group 8 had only logged are now fixed, except admin payment links (4.8):

- [x] 9.1 **Promo currency (interim):** promo codes have no currency (FLAT values and min/max are rupees), so `applyPromoCode` refuses non-INR payments ("Promo codes can only be used for INR payments") until `txn_promo_codes` gets a currency column. Only INR gateways are active today.
- [x] 9.2 **Hidden plans:** public plan orders require `active` **and** `isVisibleOnWeb`. All 278 plan fees are active, so the fee `active` flag is not checked (the `details` scope doesn't select it).
- [x] 9.3 **`POST member/create` (High, already there):**
  - It no longer changes an existing member's profile (it used to overwrite name, franchise, referrer and reset `hasAnyPlan`).
  - Checkout tokens only reach invoices of records created in their own session. `CheckoutTokenGuard` exposes the token's `iat` (`@CheckoutTokenIssuedAt()`), and the public invoice downloads pass `checkoutSessionStart(iat)` (iat minus 5 minutes) to `generateInvoicePDF`; admin calls are unchanged.
  - The token still lets a returning customer check out; checking ownership with OTP is left for a separate auth item.
- [x] 9.4 **Dashboard pending amount** excludes abandoned website checkouts (`PAYMENT_GATEWAY` with no admin creator).
- [x] 9.5 **Product tax (4.6 bug):** `calculateOrderItemsTax` passed the franchise and billing addresses to `calculateTax` in swapped order; fixed for admin and public. Domestic GST results are unchanged; export and place-of-supply are now correct.
- [x] 9.6 **Product rounding:** public product lines are rounded to the currency before summing, so the stored lines add up exactly to the charged total (live: 1 line = ₹2,288 = order total).
- [x] 9.7 **Website rendering:** `CheckoutComponent` now calls `markForCheck()` once each async step settles (zoneless), so the summary and status render with no interaction. The NG0100 error is gone in both the browser and SSR.
- [x] 9.8 **Website:** a tax error kept the customer on a blank review step, because the gateway check cleared `error`. Billing now stops and shows the server message.
- [x] 9.9 **Regression from 8.2 (caught in browser testing):** the admin stores an empty product "valid to" as **1970-01-01**, and the sellable-price filter treated it as expired, blocking all product checkouts. An end date before the start (or at the epoch) now means no end date, in both `findSellablePrice` and the suspicious-records SQL (which would otherwise flag every product order).
- Still logged: create admin payment links from the stored record total (4.8). The daily `payment_gateway_event_exceptions.sql` catches mismatches until then.
- Checks:
  - member jest passes (11 suites, 121 tests); core still has the old AbilitiesGuard failure (1 test); both apps and the website build; web lint shows no new problems.
  - Live, in Chrome: the product checkout (₹1,200 × 2) rendered at once; promo applied, then removed; PENDING order 46 for ₹2,288. You completed the Razorpay test payment, and verify set PAID, invoice `MEMUM/2026-27/P/000005`, promo `used_count` 2 and the `verify:` event row. The success page shows Paid.
  - **Side effect:** the paid event booked a **live NimbusPost shipment** (Delhivery AWB 4152922405330, shipment 37), because local data has the production courier account. Cancel it in the admin or NimbusPost.

## Group 7: Close-out

- [ ] 7.1 Every check in `validation.md` passes.
- [ ] 7.2 Set `requirements.md` status to Shipped. Mark roadmap 4.5 ✅ with a link.
- [x] 7.3 Replan notes:
  - The state matrix and confirmation service become the contract for 8.1 (Telr) and 8.2 (Stripe).
  - 4.9 picks up refund events from `txn_payment_gateway_events`.
  - New follow-ups found during 4.5:
    - **Security (High, existing):** `POST member/create` gives a checkout token for any existing member matched by email or phone (invoice download, profile overwrite). Needs its own roadmap item.
    - **4.6:** product tax passes the franchise and billing addresses in swapped order to `calculateTax`; product totals have rounding drift.
    - **4.8:** create admin payment links from the stored record total; review `payment_gateway_event_exceptions.sql` daily until then.
    - **Website:** the checkout component (zoneless, plain fields) doesn't re-render after its initial loads ("0 items" until interaction) and logs NG0100. Convert its state to signals.
    - **Promo:** decide currency and eligibility before enabling foreign-currency checkout.
- **Close-out status (2026-10-10):**
  - 7.1: the agent-run checks pass, and the scorecard records 15 of 18 criteria ✅. **Still open for the owner:** A16 (product, foreign currency, Safari, mobile), A17 and 6.2 (production-copy run, gateway reconciliation, sharing with Accounts), the migration on a production copy, the remaining manual Razorpay cases, and sign-off on the review section.
  - 7.2: not done yet. Set `requirements.md` to Shipped and roadmap 4.5 to ✅ after those checks and the PR merge into `m3-cms-update`.

