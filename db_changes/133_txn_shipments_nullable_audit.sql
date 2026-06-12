-- -----------------------------------------------------------------------------
-- 133_txn_shipments_nullable_audit.sql
--
-- Allow NULL for created_by / modified_by on txn_shipments so the system can
-- write shipments triggered by customer-initiated flows (Razorpay webhook,
-- payment-link callback) where no admin user is acting. The FK to
-- mst_admin_users stays in place — it just no longer forces every row to be
-- attributed to an admin. Matches the convention already in use on
-- txn_member_product.created_by.
-- -----------------------------------------------------------------------------

ALTER TABLE public.txn_shipments
    ALTER COLUMN created_by  DROP NOT NULL,
    ALTER COLUMN modified_by DROP NOT NULL;
