# Requirements: Compliant Invoice Numbering (≤16 characters) and Unregistered Turnover Warning

| Field | Value |
|-------|-------|
| Status | Approved 2026-10-17; in progress (plan groups 0–1 done) |
| Branch | `feature/tax-engine-correctness` (owner decision 2026-10-17: stays on the branch that holds the unreleased 4.5 / 4.6 / 4.7 / 4.11 work and ships with it) |
| Roadmap | Phase 4: amends **4.7** (invoice series) and adds the turnover warning to **4.11** |
| References | [Tax & invoice series matrix, §7 external validation](https://claude.ai/artifact/Mg89mVds7Dyjx1hvwd8N8v) (V1, V2, V3, V4, V9); [4.7 requirements](../2026-10-10-invoice-number-non-gst/requirements.md) decisions 3, 13–17; [tax mapping matrix](../2026-10-10-tax-mapping-matrix/requirements.md) decisions 5a, 13; CGST Rule 46(b), Rule 53(1A)(c); e-invoice schema v1.03 `DocDtls.No`; CGST s.22, s.24 |
| Apps touched | db_changes / shared-library / server_1 / eatfit247-admin |

## Context

On 17 Oct 2026 the tax and invoice logic was checked against India Compliance (ERPNext), Odoo (`l10n_in`, `l10n_ae`) and the primary law. The tax decisions held up. The **invoice number format did not**:

- Rule 46(b) allows a tax-invoice serial number of **at most 16 characters**, using letters, digits, `/` and `-`, unique in the financial year, "in one or multiple series". The e-invoice schema enforces `^[A-Za-z1-9][A-Za-z0-9/-]{0,15}$`. India Compliance refuses to save a longer sales invoice; Odoo warns and its e-invoicing rejects it.
- EFMUM numbers are 22 characters today (`EFMUM/2026-27/S/000491`), and 4.7's export format is 26 (`EFMUM/EXP/2026-27/S/000001`). 4.7 decision 3 had accepted this as a risk, because Accounts re-keys the numbers into Tally. The printed number and the filed number therefore differ.

**Owner decisions on 17 Oct 2026**
- Change the format now. Keep it in configuration, not in code. `EFM/2627/S/00203` is acceptable until the CA confirms the Tally format.
- The counter is not reset: the next number continues the current sequence.
- **Do not touch issued invoices.** No bank statements are available, and the database cannot prove which Q2 foreign-client payments were foreign money. Q2 has 66 foreign-client rows, all in INR. The narrations show about 16 exchange-house (RDA), Remitly or PayPal credits. About 35 came over Indian rails, which may or may not be NRE. About 12 have no evidence. So migration 138's Q2 renumbering is **retired**, and every invoice issued before go-live keeps its number, series and tax.
- Mahi Enterprise has its own PAN and its own Razorpay account. EFMUM is therefore not an e-commerce operator for Mahi's sales (no TCS), and Mahi stays unregistered while it is under the threshold. The owner wants a **warning** before Mahi reaches the registration threshold.
- An export without a valid LUT is charged IGST, as the law says. This is the current behaviour. LUTs are already stored per franchise.
- Refund and GST credit-note flows are out of scope; the business does not refund today.

## User Stories

- As **Accounts (India)**, I want every new EFMUM invoice number to be at most 16 characters, so that the number on the invoice is the number we file in GSTR-1.
- As a **franchise owner**, I want to set my franchise's invoice prefix and number format in the admin, so that a change needs no deployment.
- As **Accounts**, I want the next number to continue the current counter, and every invoice issued before the change to stay exactly as issued.
- As a **super admin**, I want to be warned when an unregistered franchise's turnover approaches the GST registration threshold, so that Mahi registers in time.
- As **Accounts**, I want a "Documents issued" report that lists every number series used in a filing period with its first and last number, total issued and cancelled, so that GSTR-1 Table 13 is copied from the system, not built by hand.
- As a **finance admin**, I want the payment form to suggest the right payment mode when a foreign client pays by remittance (SWIFT, an exchange house / RDA, Remitly, Wise), so that new exports are priced and numbered correctly.

## Scope

**In scope**
- Per-franchise invoice number format: `invoice_prefix` and `invoice_number_format` (template) on `mst_franchises`, edited on the admin franchise form with a live preview and a length check.
- A format engine used by `InvoiceSequenceService` for invoices and credit notes. The legacy code path stays for franchises with no template (HCUAE).
- Seeding EFMUM (`EFM`) and MEMUM (`MEM`) with the template `{PREFIX}/{FY}/{TYPE}/{SEQ5}` in migration 145.
- Retiring migration 138 and its preview script, and updating the 4.7 spec and the release runbook to match.
- An issue-time guard: a GST-registered Indian franchise never issues a number that breaks Rule 46(b).
- A registration-threshold warning for franchises without a GSTIN: financial-year turnover against a per-franchise threshold, amber at 80%, red at 100%, plus an email to super admins.
- Payment modes for remittance services (RDA / exchange house, Remitly / Wise) mapped to `FOREIGN_REMITTANCE`, and a payment-form hint for foreign clients.
- A **"Documents issued (GSTR-1 Table 13)" report** in admin Reports: per franchise and filing period, one row per series, with CSV download.

**Out of scope**
- Changing any issued invoice: number, series, date or tax, in any quarter.
- Tax corrections on Q2 foreign-client invoices issued at 0%. That is a CA decision; the e-FIRA question stays open.
- Refunds, GST credit notes and receipt/refund vouchers (roadmap 4.9).
- HCUAE's format. UAE has no length limit and its 2026 VAT periods are open.
- The rest of the GSTR-1 workbook (B2CS, B2CL, EXP, HSN; roadmap 4.13); only Table 13 is built here. Blocking checkout at the threshold.
- The UAE findings V8 (Art 41 licence evidence) and V10 (credit-note value lines), and the place-of-supply print format (V7 / N8). Those are other features.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Issued invoices are never changed.** Q1, Q2 and October-to-go-live keep their numbers, series and tax. Migration 138 is retired as a no-op that refuses to run, and its preview script is marked retired. Supersedes 4.7 decisions 13–17. | Owner 2026-10-17. The Q2 export classification can't be proved without bank statements, and principle 10 says issued invoices are immutable. |
| 2 | **The format is configuration per franchise.** New nullable columns `mst_franchises.invoice_prefix` (1–5 characters, `[A-Z0-9]`) and `invoice_number_format` (a template). NULL means the legacy format, which keeps HCUAE unchanged. | Owner: "keep number format in config table". A per-franchise row is read on every issue, so a change needs no restart, unlike `mst_configs`. |
| 3 | **Template tokens.** `{PREFIX}`. `{FY}`: `2627` for an April start, `2026` for a January start. `{TYPE}`: one letter. `{SEQn}`: the counter zero-padded to n digits, n from 3 to 8. Literal separators may only be `/` and `-`. Seeded template: `{PREFIX}/{FY}/{TYPE}/{SEQ5}`, which gives `EFM/2627/S/00492`, 16 characters. | Fits Rule 46(b) with room to grow: five digits allow 99,999 per series per year, against about 900 a year for EFMUM today. |
| 4 | **Type letters** (fixed in code): `S` domestic service, `E` export service, `P` domestic product, `X` export product, `C` credit note. | The series and the document type share one letter, so the number stays within 16 characters. Each letter is its own Rule 46 series and its own GSTR-1 Table 13 row. |
| 5 | **The counter continues.** The counter key stays `(franchise, invoice type, FY, series)`. The format only changes how a number is printed, so EFMUM's next domestic service number after `EFMUM/2026-27/S/000491` is `EFM/2627/S/00492`. A new series (for example the first export) starts at `00001` on first use. | Owner: "last sequence number won't change". No gap, and no reuse, because the digits never repeat within the FY. |
| 6 | **Save-time validation.** The franchise form and API reject a template unless it renders, at the counter's maximum (all 9s) and with every type letter, to a string that matches `^[A-Za-z1-9][A-Za-z0-9/-]{0,15}$`. This applies to a franchise whose country is India. Other countries only need a non-empty prefix and valid tokens. | A format that could break the limit must never reach issuing. |
| 7 | **Issue-time guard.** If a rendered number for an Indian franchise ever breaks the regex, issuing throws and the transaction rolls back (no number consumed). It is logged at error level. Decision 6 makes this unreachable. | A non-compliant number must never be issued silently. Because no number is consumed, there is no gap. |
| 8 | **Credit notes use the same engine** with type `C`. This takes effect only when a franchise with a template issues one. Today only VAT credit notes exist (HCUAE, legacy format), so this is groundwork for 4.9. | Rule 53(1A)(c) applies the same 16-character limit to credit notes. |
| 9 | **The series rule is unchanged.** EXPORT means the stored tax mode is an export mode, as today. A foreign client paying INR over Indian rails is IGST, so domestic series `S`. | GSTR-1 reports that supply as B2C with place of supply 96, never as an export. Odoo and the law both keep the series tied to export status. |
| 10 | **Remittance payment modes.** Migration 145 adds "Remittance via exchange house (RDA)" and "Remittance app (Remitly / Wise)", both routed `FOREIGN_REMITTANCE`. The admin payment form shows a hint when the billing country is not India and the chosen mode is domestic: "Paid from abroad? Pick the remittance mode so it is priced as an export." | Q2 narrations show these channels, but staff recorded them as Cash, UPI or Other because no matching mode existed. |
| 11 | **No-LUT export = IGST, unchanged.** No new setting. | Owner 2026-10-17. LUTs are already per franchise (`mst_franchise_luts`). |
| 12 | **Turnover warning.** New nullable `mst_franchises.registration_threshold_amount` (INR). The warning applies when the threshold is set and the franchise has no GSTIN. FY turnover = the sum of `functional_total_amount`, else `total_amount`, of issued plan payments and product orders whose `invoice_date` falls in the franchise's current FY. Shown on the franchise list, the franchise details page and the admin dashboard: amber from 80%, red from 100%. A daily cron emails super admins once per FY per level crossed; the last level sent is stored on the franchise. Checkout is never blocked. Migration 145 seeds MEMUM with 4,000,000 (₹40 lakh, goods; the CA confirms). | Owner: "turnover warning will be best". s.22 counts all-India supplies under the PAN, so the platform figure is a lower bound, and the UI says so. |
| 13 | **Table 13 comes from the system: one row per series.** The report covers a franchise and a period (a month, or a quarter for QRMP filers), selected by `invoice_date`, else `payment_date` for rows issued before 137. A **series** is the issued number with its trailing digit run removed (`EFMUM/2026-27/S/`, `EFM/2627/S/`, `EFM/2627/E/`, `MEM/2627/P/`, `…/C/`). Grouping is exact, because every number is built from a known template; it is not guessed from neighbouring names. Each row shows nature of document ("Invoices for outward supply"; "Credit note" for type C and legacy CN), from, to, total issued, cancelled, and net issued. **Cancelled** = an issued number whose row is now inactive or no longer PAID (decision 9 of 4.7: numbers are never removed). The old long-format range and the new short-format range of the same counter appear as **two rows**. A row also carries a **gap check**: when the count is below `to − from + 1`, the row is flagged with the missing numbers. This should never happen (principle 2) and is shown for audit. Gateway, admin and webhook invoices are all included. Rows of an unregistered franchise (MEMUM without a GSTIN) are labelled "not a tax invoice; not reported", because Table 13 belongs to a GSTIN. | ERP check, 17 Oct 2026. India Compliance builds Table 13 from document names and splits series heuristically. It starts a new row at any break in +1 order and counts drafts, submitted and cancelled into "total issued" (`gstr_1/gstr_1_data.py:883-969`). It documents false positives. Odoo keeps one series per journal plus a refund series. We have explicit series, so the grouping can be exact. A gap becomes a visible audit flag instead of a silent extra row. Accounts copies rows straight into the portal. |
| 14 | **Go-live sequencing.** 145 runs with both APIs stopped, after 137–144, in place of 138. The first invoice issued after start-up uses the new format. | No invoice may be issued while the format changes. |
| 15 | **New data only, every channel.** From go-live, every invoice issued for a new payment or order uses the format, series rule and guards of this feature: admin plan create and edit-to-PAID, admin product create, and website checkout confirmed by the gateway webhook. All of them go through `InvoiceIssueService.issue`. Rows issued earlier, including the Q2 foreign-client invoices at 0%, are read-only history. | Owner 2026-10-17: "system should work for new data coming from admin or website". |

## Technical Constraints

- **Data:** `db_changes/145_compliant_invoice_numbering.sql` (idempotent, one transaction):
  - `mst_franchises`: `invoice_prefix VARCHAR(5)`, `invoice_number_format VARCHAR(40)`, `registration_threshold_amount NUMERIC(14,2)`, `turnover_alert_fy VARCHAR(10)`, `turnover_alert_level SMALLINT`.
  - Seed EFMUM/MEMUM prefix and template, and MEMUM's threshold, only where NULL.
  - Two payment modes (`WHERE NOT EXISTS`).
  - `138_…sql` is replaced by a guard that raises "retired" and changes nothing.
  - No new tables. Soft delete unchanged.
- **Contract:** `IFranchise.invoicePrefix`, `invoiceNumberFormat`, `registrationThresholdAmount`; `IFranchiseTurnover { financialYear, turnover, threshold, percent, level }`; an `InvoiceNumberFormatUtil` (render + validate) in shared-library, so the admin preview and the server use the same code.
- **API:** the franchise DTO validates the new fields. New `GET franchise/:id/turnover` (admin, Franchise read); the dashboard reuses it. New `GET reports/documents-issued?franchiseId&from&to` and its CSV export (admin-only reports lib, `Report` read).
- **RBAC:** existing `Franchise` subject (read for turnover; update for the format) and `Report` subject (read for Table 13). Franchise-scoped as today. No new subjects.
- **Money:** principle 2 holds: same counters, no reset, no reuse. Principle 10 holds: nothing issued is edited. The tax engine is unchanged.
- **Async:** a daily turnover cron (same scheduler as `invoice-fx.cron.ts`), idempotent through `turnover_alert_fy` / `turnover_alert_level`.

## Principle Check

| Principle | How this feature respects it |
|---|---|
| 1 Tax at payment | Unchanged. The format applies only at issue, and Table 13 reads stored numbers. |
| 2 No invoice gaps | The counters continue. The guard (decision 7) rolls back without consuming a number. The exception text changes: FY 2026-27 numbers issued before go-live stay as issued, in the long format, with foreign clients in the domestic series. **Constitution change**: mission.md principle 2, recorded for replanning. |
| 3 Franchise isolation | Format and turnover are per franchise; the turnover endpoint is franchise-scoped. |
| 5 Permissions in data | Existing Franchise subject; no role checks in code. |
| 6 Soft delete | Nothing deleted. 138 is retired, not removed. |
| 8 One contract | The format util and interfaces live in shared-library. |
| 9 Automated proof | Unit tests for the format engine, issuing and turnover; migration rehearsal. |
| 10 Issued invoices immutable | Decision 1: no issued row is changed. |
| 11 Server owns money state | Unchanged. |

## Open Questions

- [x] **[Owner]** Number format: keep `{PREFIX}/{FY}/{TYPE}/{SEQ5}` (`EFM/2627/S/00492`) (2026-10-17).
- [x] **[Owner]** Mahi's goods registration threshold: ₹40 lakh confirmed (2026-10-17).
- [x] **[Owner]** GSTR-1 Table 13: the system decides, following the ERP check. Decision 13: one row per series, exact grouping, cancelled counted, gaps flagged (2026-10-17).
- [x] **[Owner]** Tally number format: skipped (2026-10-17). The decided format is used. If the CA later asks for another one, it is a franchise-form setting, with no code change.
- [x] **[Owner]** Q2 foreign-client invoices: stay as issued at 0% (2026-10-17). Nothing changes on old data. The rules in this feature apply only to payments and orders created after go-live, whether entered in admin or bought on the website.
