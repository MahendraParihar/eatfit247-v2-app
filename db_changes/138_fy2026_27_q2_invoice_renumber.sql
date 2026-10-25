-- =============================================================================
-- 138_fy2026_27_q2_invoice_renumber.sql — RETIRED 2026-10-17. DO NOT RUN.
-- =============================================================================
-- This migration renumbered FY 2026-27 invoices of EFMUM and MEMUM issued from
-- 1 July 2026 into a domestic and an export series (roadmap 4.7 decisions
-- 13–17). It is retired by
-- specs/features/2026-10-17-compliant-invoice-numbering decision 1: issued
-- invoices are never changed. Without bank statements the database cannot prove
-- which Q2 foreign-client payments were foreign money, so every invoice issued
-- before go-live keeps its number, series, date and tax.
--
-- Run 145_compliant_invoice_numbering.sql instead. This file only raises an
-- exception, so running it by mistake changes nothing.
--
-- The original body is kept in the git history only (last version: commit
-- db0918bd, `git show db0918bd:db_changes/138_fy2026_27_q2_invoice_renumber.sql`).
-- =============================================================================

DO
$$
BEGIN
    RAISE EXCEPTION 'Retired by specs/features/2026-10-17-compliant-invoice-numbering decision 1. Do not run.';
END
$$;
