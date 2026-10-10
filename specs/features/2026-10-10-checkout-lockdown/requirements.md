# Requirements: Checkout and Webhook Lockdown

| Field | Value |
|-------|-------|
| Status | Shipped (2026-10-10). Owner steps after merge are in validation.md "Post-ship" |
| Branch | `feature/10-10-2026-checkout-lockdown`; PR into `m3-cms-update` |
| Roadmap | Phase 4: **4.5** Checkout and webhook lockdown (P0) |
| References | [Accounting audit](../../backlog/2026-10-10-accounting-audit.md) findings C1, H7, M5; [mission.md](../../product/mission.md) principles 7, 10, 11 |
| Apps touched | server_1 / shared-library / eatfit247-web-1 / db_changes |

## Context

The public website currently creates the payment or order record **after** the customer pays, and the record is built from data the browser sends. Plan checkout (`checkout.component.ts:668-790`) works like this:

1. The browser calls `POST checkout/plan/member/:id/payment-order` with an **amount chosen by the browser**. The server creates a Razorpay order for that amount.
2. The customer pays in the Razorpay modal.
3. The browser calls `verify-payment`. The server checks the signature and returns `verified`, but stores nothing.
4. The browser calls `POST checkout/plan/member/:id/order` with `paymentStatusId: PAID`, `paymentSource: PAYMENT_GATEWAY`, `paymentDate`, `discountAmount` and `gatewayOrderId`.
5. `create()` trusts those values. Because the status is PAID, it issues an invoice number straight away (`member-plan.service.ts:422-434`).

Product checkout (`checkout/member/:id/product/...`) follows the same pattern.

**Risk (audit C1, Critical).** Anyone with a checkout token can skip step 2 and post step 4 directly. They get a PAID plan, a real invoice number (a GST liability on money never received) and a diet-plan entitlement, without paying. `discountAmount` has `@Min(0)` but no maximum.

**Webhook gaps (audit H7).**
- `updatePlanPayment` only skips PAID→PAID, so a late `payment.failed` can turn a PAID, invoiced record into FAILED (`razorpay-webhook.controller.ts:758-772`).
- `payment.captured` and `order.paid` share one handler and take no row lock, so two parallel events can each issue an invoice number.
- Amounts are divided by 100 for every currency (lines 258, 304).
- Webhook events are not stored. The only record is application logs.

**Promo codes (audit M5).**
- `PromoCodeService.applyPromoCode` checks active, expiry, minimum order and usage limit, but it is only exposed to admin.
- `used_count` is never incremented, so usage limits can't work.
- The website has no promo field and always sends `promoCode: undefined`.

## User Stories

- As **EatFit247**, I want a plan or product to become PAID only when the payment gateway confirms the money, so that no one gets a paid plan or an invoice without paying.
- As a **customer**, I want to enter a promo code at checkout and see the discount applied, so that I pay the promoted price.
- As **Accounts**, I want every gateway event stored, and a report of any suspicious PAID records already created, so that I can reconcile and investigate.

## Scope

**In scope**

- **Order-first checkout for plans and products.**
  - The server creates a PENDING record before payment and prices it from the master price, tax and a validated promo code.
  - The server then creates the gateway order for exactly that total.
  - Only a gateway-confirmed event moves the record to PAID: a verified webhook, or the server-side verify call, which fetches the payment from the gateway.
- **The public API never accepts money state from the client.** It ignores or rejects payment status, source, date, amount, discount, transaction id, gateway order or payment ids, and gateway response.
- **Server-side promo validation** on public checkout through the existing `applyPromoCode`, with `used_count` incremented once when the order becomes PAID.
- **Forward-only payment status from the gateway.** A PAID record never goes back to PENDING or FAILED through a gateway event. The record is row-locked before any status change or invoice issue.
- **Currency-aware minor units** when converting gateway amounts.
- **Gateway event log:** a new table storing every webhook event, with idempotency by event id.
- **Website checkout updated** to the new flow, including a promo-code field.
- **Read-only report** of suspicious PAID records already created through public checkout.

- **Admin gateway payments (added 2026-10-10, owner decision).** The admin plan-payment and product-order dialogs follow the same order-first rule: decisions 13 and 14.

**Out of scope**

- Admin manual payment entry. Admins may still record PAID offline payments (source MANUAL); they are authorised (principle 11).
- Refund accounting and credit notes (4.9). Refund events are logged and the refund JSON keeps being stored, but status and tax are not changed.
- Choosing which franchise and gateway receive the payment (4.12). Checkout keeps today's gateway resolution, but the chosen `franchisePaymentGatewayId` is stored on the PENDING record and reused for verification.
- Tax correctness (4.6) and invoice series (4.7).
- Telr and Stripe go-live (Phase 8). The design must be gateway-agnostic, but only Razorpay is tested.
- Automatically correcting suspicious historical records. The report is for Accounts to review.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Order first.** `POST …/order` (plan and product) takes only what the customer chooses: plan or product and variant, quantity, currency, address ids, optional GSTIN, optional promo code, and optional gateway choice. In one transaction the server prices the order, creates the PENDING record (`payment_source = PAYMENT_GATEWAY`, `payment_date = NULL`), creates the gateway order for the record's `total_amount`, stores `gateway_order_id`, `gateway_provider` and `franchise_payment_gateway_id`, and returns the gateway checkout payload. | The amount is fixed by the server before the customer pays, and the record exists for the webhook to find. This is the industry-standard pattern. |
| 2 | The public `payment-order` and `payment-link` endpoints no longer accept an `amount`. They are removed from the public flow, or, if still needed for the payment-link path, they take only the id of an existing PENDING record and use its stored total. | A client-chosen gateway amount is the root of the mismatch risk. |
| 3 | **Only gateway confirmation sets PAID.** Two paths call one shared, idempotent service method `confirmGatewayPayment(gatewayOrderId, gatewayPaymentId)`: (a) the verified webhook; (b) the public `verify-payment` call. In (b) the server checks the signature **and fetches the payment from the gateway API** (status captured, amount and currency equal to the record). The method locks the row (`SELECT … FOR UPDATE`), sets PAID, `payment_date` (from the gateway's capture time) and `gateway_payment_id`, issues the invoice number, and emits the paid event. Whichever path arrives second does nothing. | The customer sees success immediately, the webhook remains the backstop, and neither path trusts the browser. |
| 4 | **Public DTOs are whitelisted.** Money-state fields are removed from the public DTOs, and the global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) is enforced on these routes, so a client sending `paymentStatusId` gets 400. | Defence in depth: a forgotten field can't leak through. |
| 5 | **Promo codes.** The client sends only `promoCode`. The server calls `applyPromoCode` for the plan or order amount and stores the code and its discount on the PENDING record. An invalid code returns 400 with the service's message. The tax-calculation endpoint takes `promoCode` instead of `discountAmount`. `used_count` is incremented in the same transaction that sets PAID, and the usage limit is checked again under lock at that point. If it has been reached, the payment is still accepted (the money is already taken), and the over-limit use is flagged in the event log for Accounts. | The customer must see the discounted total before paying, and usage must count real paid orders only. A captured payment is never refused. |
| 6 | **Forward-only status matrix (gateway events):** PENDING → PAID or FAILED. FAILED → PAID (a retry succeeded). PAID → nothing (failure and cancel events are logged and ignored). Refund events are logged, and `refundObj` is stored as today; the status change is left to 4.9. | A late or out-of-order event must never undo a confirmed payment or invoice. |
| 7 | **Partial payment** (`payment_link.partially_paid`): the record stays PENDING and the event is logged. No invoice is issued. | Same as today, now with evidence. |
| 8 | **Minor units by currency:** an ISO-4217 exponent map (0, 2 or 3 decimals) is used for every gateway amount conversion. | Correct amounts for JPY- or KWD-style currencies; no hard-coded /100. |
| 9 | **Event log:** new table `txn_payment_gateway_events` (event id unique per provider, provider, event type, gateway order and payment ids, amount and currency, signature-valid flag, raw payload JSONB, processing result enum: APPLIED / IGNORED_DUPLICATE / IGNORED_STATE / ORDER_NOT_FOUND / ERROR, message, linked record, received_at). The event is inserted first; a duplicate event id short-circuits. | Idempotency, audit trail (principle 10), reconciliation evidence. |
| 10 | **Abandoned PENDING records** stay PENDING (their proforma is available). No cleanup job. A payment that fails becomes FAILED. | Simple. They carry no invoice number and no tax liability. |
| 11 | **Diet-plan container.** `createIfNotExists` keeps running at record creation, as today, but the server-side "payment before diet plan" check (principle 7) must rely on PAID status. The implementer verifies this, and fixes it if the check only looks for the row's existence. | A PENDING checkout record must not unlock diet-plan work. |
| 13 | **Admin gateway payments: save first, then link.** In the admin dialogs (plan and product), choosing "Payment Gateway" saves the PENDING record in one server call, prices it on the server (as for manual records), then creates the Razorpay payment link for the record's stored `total_amount` and stores the link id, URL, provider and `franchise_payment_gateway_id`. The link is shown for copying only after the save. If the link can't be created, the record is rolled back. The standalone admin `create-payment-link` endpoints are removed. | A link can no longer exist without a record (money captured with no record), and its amount always equals the stored total. |
| 14 | **The gateway decides the status of gateway records.** For a PAYMENT_GATEWAY record, admins can't set the payment status, payment date, transaction id or gateway ids (create forces PENDING; update keeps the stored values). Its source can't be switched. While it isn't PAID, the plan, currency, discount and billing address can't be edited. Instead the admin uses **Cancel payment link** (the link is cancelled at Razorpay and the record goes PENDING → FAILED) and creates a new payment. **Regenerate link** cancels the old link at Razorpay before creating a new one for the stored total. Offline payments are recorded as MANUAL payments. | Only gateway-confirmed money sets PAID on gateway records (principle 11), and no old link stays payable after it has been replaced. |
| 12 | **Suspicious-records report:** a read-only SQL file listing public-checkout PAID rows (plans and products) with any of: no `gateway_payment_id`; `discount_amount > 0` with no valid promo; total ≠ master price + tax ± 0.01; gateway order id duplicated. Accounts reviews it, and nothing is changed automatically. | Size and investigate any past abuse without touching filed data. |

## Technical Constraints

- **Data:**
  - `db_changes/139_payment_gateway_events.sql` (number assigned at implementation; it must not collide with the 137/138 reserved by 4.7) creates `txn_payment_gateway_events` with audit columns, plus a unique index on `(provider, event_id)`.
  - Add `franchise_payment_gateway_id` to `txn_member_payments` and `txn_member_products` if it is not already present.
  - `payment_date` must accept NULL for PENDING gateway records. Check the current constraint; plan 4.7 relies on `invoice_date` for the FY.
- **Contract:**
  - New public request and response interfaces in shared-library: `IPublicPlanOrderRequest`, `IPublicProductOrderRequest`, `IPublicCheckoutOrderResponse` (record id, gateway checkout payload, priced breakdown).
  - The tax-calculation request takes `promoCode?`.
  - Admin interfaces are unchanged.
- **API (public-api):**
  - `POST checkout/plan/member/:memberId/order` and `POST checkout/member/:memberId/product/order` change meaning to create-before-pay.
  - `verify-payment` confirms through the shared service.
  - `payment-order` and `payment-link` no longer take `amount`.
  - Errors use `IErrorResponse`; validation errors return 400.
- **RBAC:** none. Public routes keep `CheckoutTokenGuard` + reCAPTCHA.
- **Money:** principle 11 is enforced. The invoice is issued only inside `confirmGatewayPayment` (public) or admin create/update (admin). The tax snapshot is computed at PENDING creation (principle 1).
- **Async:** webhook handlers become: verify the signature → insert the event (idempotent) → `confirmGatewayPayment` or a state-specific handler → update the event result. The paid event (`order.product.paid`, and the plan equivalent) fires once, after commit.

## Principle Check

| Principle | Status |
|-----------|--------|
| 1 Tax at payment | ✅ Tax is computed and stored on the PENDING record when the price is fixed. Nothing is recomputed at confirmation. |
| 2 No invoice gaps | ✅ The number is issued once, under a row lock, so duplicate events can't burn numbers. |
| 3 Franchise isolation | ✅ No change to admin scoping. |
| 6 Soft delete only | ✅ No deletes. Events are append-only. |
| 7 Ordered journey | ✅ PAID comes only from the gateway; diet-plan gating is checked (decision 11). |
| 8 One contract | ✅ New public interfaces in shared-library. |
| 9 Automated proof | ⚠️ Unit tests plus Razorpay test-mode manual checks. Integration and e2e tests wait for 5.3 and 5.4. |
| 10 Immutable invoices / change log | ✅ for gateway events (append-only log). Admin edits remain 4.8. |
| 11 Server owns money state | ✅ This feature implements it. |
| 4, 5 | N/A |

## Open Questions

- [x] Does the website ever use the payment-link flow (`payment-link` endpoints), or only the embedded order flow? **Resolved:** the website never called them (its `createPaymentLink` was dead code with a wrong URL), so the public `payment-link` and `payment-order` endpoints were removed.
- [ ] Promo eligibility: should codes be limited by plan, product or franchise? Today `applyPromoCode` checks only active, expiry, minimum amount and usage. Kept that for 4.5. **Also decide currency:** promo codes have no currency, so a FLAT INR code would apply as-is to a USD/AED order (plan.md 8.x). Only INR gateways are active today.
- [ ] Whether to show the suspicious-records report to the owner before Accounts sees it.
