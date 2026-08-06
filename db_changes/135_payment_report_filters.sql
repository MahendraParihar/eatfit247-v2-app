-- 135_payment_report_filters.sql
-- Indexes supporting the extended Member Payment Report filters
-- (date range + member search + billing-country filter).
--
-- Deliberately NOT indexed: tax_type, tax_mode, is_tax_applicable, currency,
-- total_amount. Each holds only 2-6 distinct values across the table, so the
-- planner will bitmap- or seq-scan regardless while the date range does the real
-- filtering. Revisit only if EXPLAIN ANALYZE on production says otherwise.

-- Primary range predicate for the report. The included member_payment_id matches
-- the query's tiebreaker, so ORDER BY payment_date DESC, member_payment_id DESC
-- can be satisfied by an index scan.
CREATE INDEX IF NOT EXISTS idx_txn_member_payment_active_date
    ON public.txn_member_payments (payment_date DESC, member_payment_id DESC)
    WHERE active = true;

-- Member free-text search. The filter uses a leading-wildcard ILIKE, which without
-- trigram indexes is a guaranteed sequential scan of txn_members.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- IMPORTANT: this expression must stay character-for-character identical to
-- MEMBER_FULL_NAME_SQL in payment-report.service.ts, or the planner will ignore
-- the index. COALESCE is required because last_name is nullable (a || NULL = NULL);
-- BTRIM matches the trimmed name the API returns.
CREATE INDEX IF NOT EXISTS idx_txn_member_full_name_trgm
    ON public.txn_members
    USING gin ((BTRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_txn_member_email_trgm
    ON public.txn_members USING gin (email_id gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_txn_member_contact_trgm
    ON public.txn_members USING gin (contact_number gin_trgm_ops);

-- Billing-country source for the country filter joins txn_addresses on
-- billing_address_id and filters by country_id, which has no index today.
CREATE INDEX IF NOT EXISTS idx_txn_address_country_id
    ON public.txn_addresses (country_id);

-- Member-country source filters txn_members.country_id directly.
CREATE INDEX IF NOT EXISTS idx_txn_member_country_id
    ON public.txn_members (country_id);
