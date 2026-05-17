-- ============================================================================
-- 121: Drop unused program FAQ tables
-- Reason: txn_program_faq and txn_program_faqs are not referenced by any
-- application code. Program FAQs are sourced from txn_faqs joined to
-- mst_faq_categories where faq_category_id = 4.
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS txn_program_faq CASCADE;
DROP TABLE IF EXISTS txn_program_faqs CASCADE;

COMMIT;
