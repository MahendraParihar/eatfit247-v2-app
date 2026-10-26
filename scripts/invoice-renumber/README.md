# FY 2026-27 invoice resequencing (26–27 Oct 2026)

One-off correction of EFMUM invoice numbers issued from 1 Jul 2026, done in the
database on 26 Oct 2026 for the GSTR-1 filing. The code ships on 27 Oct.

Owner decisions (26 Oct 2026):

- **Q1 (Apr–Jun) is filed and isn't touched.** `EFMUM/2026-27/S/000001–000202` stay as they are.
- **Series**: we use the 4.7 decision 13 rule (the retired 138). A row is EXPORT when its billing country is not India and no tax was charged. Everything else is DOMESTIC. Domestic numbers continue after Q1, and export numbers start at 1. Inside a series, rows are ordered by payment date, then `created_at`, then the primary key.
- **Format**: the compliant ≤16-character format from 1 Jul. Domestic is `EFM/2627/S/nnnnn` and export is `EFM/2627/E/nnnnn`. This is the same template migration 145 seeds.
- **Workshop**: three domestic numbers are kept free for the 11 Aug 2026 workshop invoices. They come right after the last domestic invoice dated on or before 11 Aug. **Do not run `server_1/scripts/workshop-invoice-renumber.ts`** (its +3 shift is replaced by step 3).

Every script is a **dry run unless `-v apply=1`**. It refuses to run if a guard fails or if it has already been applied.

## Today (26 Oct): production

1. Take a backup: `pg_dump "$DB_URL" -Fc -f eatfit-before-resequence-20261026.dump`
2. Stop admin-api and public-api, or at least make sure nobody saves a PAID payment while the script runs. The script locks the tables either way.
3. Dry run, and review the numbers with Accounts:
   `psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f 2026-10-26_1_resequence_fy2026_27.sql > resequence-dry-run.txt`
4. Apply:
   `psql "$DB_URL" -X -v ON_ERROR_STOP=1 -v apply=1 -f 2026-10-26_1_resequence_fy2026_27.sql > resequence-applied.txt`
5. Export the old → new list for Accounts and Tally:
   `psql "$DB_URL" -X -c "\copy (SELECT payment_date, series, old_invoice_id, new_invoice_id, billing_country, tax_amount, source_table, pk FROM bkp_20261026_invoice_resequence ORDER BY series DESC, new_invoice_id) TO 'invoice-resequence-20261026.csv' CSV HEADER"`
6. Until the release, avoid saving PAID payments in admin. The old code would issue `EFMUM/2026-27/S/000xxx`. Step 2 tomorrow converts those numbers, but any PDF already sent would show the old number.

## Release day (27 Oct): with both APIs stopped

1. `db_changes/137_invoice_series.sql`
2. `2026-10-27_2_after_137.sql`: dry run first, then `-v apply=1`. It sets `invoice_series` / `invoice_date`, creates the EXPORT counter, and converts any long-format numbers issued in between. **Without this step the next export invoice would reuse `EFM/2627/E/00001`.**
3. 139–149 (and 150 / 151 as planned), then start the APIs.
4. The admin creates the three workshop invoices as PENDING, with invoice date and supply date 11 Aug 2026 and full bill-to and payment details. Then:
   `psql "$DB_URL" -X -v ON_ERROR_STOP=1 -v w1=<id> -v w2=<id> -v w3=<id> -v admin_id=<admin> [-v apply=1] -f 2026-10-27_3_workshop_reserved.sql`
   (w1/w2 are the 200-participant invoices and w3 is the 174-participant one.)

Rollback for step 1 is in the header of `2026-10-26_1_resequence_fy2026_27.sql`. It is valid only until step 2 runs.

## Rehearsal (local production copy to 23 Oct)

On a clone of the local DB we ran 1 → a simulated old-code invoice → 137 → 2 → 139–149 → 3. Every step passed, and every re-run was refused or changed nothing. Results:

- Domestic: `EFM/2627/S/00203–00430` (225 invoices plus 3 reserved: `00302–00304`)
- Export: `EFM/2627/E/00001–00068`
- Counters after release: S 430 (431 with the simulated invoice) and E 68.

Production has two more days of data, so its dry run is the one to trust.
