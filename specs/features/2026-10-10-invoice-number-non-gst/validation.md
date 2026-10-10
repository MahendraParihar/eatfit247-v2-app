# Validation: Invoice Series and Proforma (roadmap 4.7)

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review. Accounts signs off the migration preview.
>
> **Precondition:** 4.5 is live. 4.6 is not: new invoices use the decision 1 interim rule (Indian franchise + foreign billing snapshot + no tax charged → EXPORT).

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given an EFMUM member with an **Indian** billing address, when a PAID plan payment is recorded, then `invoice_id = EFMUM/2026-27/S/<next domestic>`, `invoice_series = DOMESTIC`, and only the DOMESTIC/SERVICE counter increments | unit + manual + SQL | ☐ |
| A2 | Given an EFMUM member with a **foreign** billing address and no tax charged (e.g. member 4945, United States, INR, `NO_TAX`), when a PAID plan payment is recorded, then `invoice_id = EFMUM/EXP/2026-27/S/<next>`, `invoice_series = EXPORT` | unit + manual + SQL | ☐ |
| A2b | Given an EFMUM member with a foreign billing address who **was charged GST** (tax > 0), when a PAID payment is recorded, then the DOMESTIC series is used | unit | ☐ |
| A3 | Given a foreign product order whose items all carry the export mode, when it is PAID, then `invoice_id = MEMUM/EXP/2026-27/P/<next>` (or the configured product seller's code) | unit + manual | ☐ |
| A4 | Given a product order with **mixed** item tax modes, when an invoice would be issued, then it fails with a clear error and no counter changes | unit | ☐ |
| A5 | Given Razorpay test-mode payments (plan and product, domestic and foreign), when the capture webhook arrives, then the series follows A1–A3, `payment_date` and `invoice_date` are the franchise-local date, and a replayed webhook issues nothing | webhook spec + manual | ☐ |
| A6 | Given HCUAE members (one UAE/VAT, one non-UAE/`NO_TAX`), when they pay, then both use the single `HCUAE/{FY}/S/…` series, no EXPORT counter is created for HCUAE, `invoice_date` uses `Asia/Dubai`, and migration 138 leaves HCUAE untouched | unit + manual + SQL | ☐ |
| A7 | Given the same series, when invoices are issued concurrently, then numbers are unique and contiguous | unit (lock) + manual parallel requests | ☐ |
| A8 | Given a PENDING manual plan payment, when an admin edits it to PAID, then a number is issued in the series `resolveInvoiceSeries` gives (A2 rule), with `invoice_date` = today (local) | unit + manual | ☐ |
| A9 | Given an invoiced payment, when its status goes PAID→PENDING→PAID (or it is refunded or soft-deleted), then `invoice_id`, `invoice_series` and `invoice_date` never change and no second number is issued | unit + SQL | ☐ |
| A10 | Given an invoiced plan payment with `invoice_series` set, when an edit would move it to the other series, then the preview is blocked with a reason, Save is disabled, and the API returns 400 | unit + manual | ☐ |
| A11 | Given an invoiced plan payment, when an edit keeps the series, then it saves with today's warnings and the number is unchanged | unit + manual | ☐ |
| A12 | Given a Q1 legacy invoice (`invoice_series` NULL), when it is edited, then the series guard does not block it | unit | ☐ |
| A13 | Given a payment at 00:30 IST on 1 Apr, or a payment backdated into the previous FY, when it is invoiced, then the FY in the number and `invoice_date` follow the franchise-local issue date, not UTC and not the backdated payment date | unit | ☐ |
| A14 | Given a PENDING payment or product order, when "Download Proforma" is used, then the PDF is titled "PROFORMA INVOICE", has no number, and carries the not-a-tax-invoice note | manual (browser) | ☐ |
| A15 | Given invoiced rows, when downloaded, then the PDF is a TAX INVOICE / INVOICE showing the number and `invoice_date` (the new number for renumbered rows) | manual | ☐ |
| A16 | Given the payment-report ZIP export, then it contains only rows with an `invoice_id` | manual | ☐ |
| A17 | Given migration 138 ran, then every FY 2026-27 row with `payment_date < 2026-07-01` is unchanged (count and checksum match) and has `invoice_series` NULL | SQL assert + manual SQL | ☐ |
| A18 | Given migration 138 ran, then in-window DOMESTIC invoices per (franchise, type) run contiguously from (Q1 max + 1), ordered by payment date | SQL assert + preview diff | ☐ |
| A19 | Given migration 138 ran, then in-window EXPORT invoices per (franchise, type) run `EXP/…/000001`…N contiguously, and every one has billing country ≠ India and `tax_amount = 0` | SQL assert + preview diff | ☐ |
| A20 | Given migration 138 ran, then `bkp_138_invoice_renumber` matches the signed-off preview row for row, renumbered rows have `invoice_series` and `invoice_date = payment_date`, no `TMP138/` values remain, and a re-run aborts | SQL | ☐ |
| A21 | Given migration 138 ran, when the next domestic and export invoices are issued, then each takes counter max + 1, with no gap or collision | manual + SQL | ☐ |
| A22 | Accounts reviewed and signed off the preview before production | sign-off below | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,test,build`
- [ ] These specs pass:
  - `invoice-sequence.service.spec.ts`
  - series-helper spec
  - local-date helper spec
  - `member-plan.service` issue-on-PAID and guard specs
  - `razorpay-webhook.controller.spec.ts`
- [ ] `137` applies on a fresh DB (after 108) and on a copy of production
- [ ] `138` applies on a copy of production; guards and post-asserts pass; a re-run aborts
- [ ] **When roadmap 5.3 lands, add:** integration tests for the issuing paths (A1–A9), a concurrency test (A7), and update-guard endpoint tests (A10–A12)

## Manual Checks

SQL helpers (run before and after):

```sql
-- Counters
SELECT f.franchise_code, s.invoice_type, s.financial_year, s.series, s.current_number
FROM mst_invoice_sequences s JOIN mst_franchises f USING (franchise_id)
ORDER BY 1, 2, 3, 4;

-- Gaps or duplicates per series, FY 2026-27, plans + products (expect no rows)
WITH ids AS (
  SELECT invoice_id FROM txn_member_payments WHERE invoice_id LIKE '%/2026-27/%'
  UNION ALL
  SELECT invoice_id FROM txn_member_products WHERE invoice_id LIKE '%/2026-27/%'
), n AS (
  SELECT split_part(invoice_id, '/', 1)               AS code,
         (invoice_id LIKE '%/EXP/%')                  AS is_exp,
         substring(invoice_id from '/([SP])/[0-9]+$') AS t,
         substring(invoice_id from '([0-9]+)$')::int  AS seq
  FROM ids
), g AS (
  SELECT *, seq - lag(seq, 1, 0) OVER (PARTITION BY code, is_exp, t ORDER BY seq) AS step
  FROM n
)
SELECT * FROM g WHERE step <> 1;

-- Sizing before the migration (audit §6)
SELECT franchise_id, tax_mode, count(*) FROM txn_member_payments GROUP BY 1, 2;
SELECT tax_mode, count(*) FROM txn_member_product_order_items GROUP BY 1;
```

- [ ] Admin: domestic and foreign plan payments as PAID (A1, A2, A15); a foreign product order (A3)
- [ ] Admin: a PENDING manual payment → Download Proforma (A14) → edit to PAID → number issued (A8) → Download Invoice (A15)
- [ ] Admin: on an invoiced payment, change billing to a foreign address → blocked (A10); change notes or amount → saved (A11)
- [ ] Razorpay test mode: domestic and foreign checkout, then replay (A5)
- [ ] HCUAE: one UAE client and one non-UAE client (A6)
- [ ] ZIP export excludes proformas (A16)
- [ ] Production rehearsal on a DB copy: preview → 138 → helper SQL → A17–A21
- [ ] Release: record the values below

| Item | Value |
|------|-------|
| Accounts sign-off (name, date) | |
| 4.7 go-live timestamp | |
| Counters before 138 | |
| Counters after 138 | |

## Review

- [ ] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [ ] Deep review by subagents (bugs, invoice gaps and races, franchise leakage, conventions). Findings fixed or logged
- [ ] Specs and code are in sync; every review fix is reflected in `requirements.md` / `plan.md`
- [ ] I can explain the change (read the key tests and the migration CTEs)
