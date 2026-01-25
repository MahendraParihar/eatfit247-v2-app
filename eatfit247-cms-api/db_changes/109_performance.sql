CREATE INDEX idx_txn_member_payment_member_active_status
    ON public.txn_member_payments(member_id, active, payment_status_id)
    WHERE active = true;

CREATE INDEX idx_txn_member_payment_status_date
    ON public.txn_member_payments(payment_status_id, payment_date, active)
    WHERE active = true;

CREATE INDEX idx_txn_member_payment_franchise_status
    ON public.txn_member_payments(franchise_id, payment_status_id, active)
    WHERE active = true AND franchise_id IS NOT NULL;

CREATE INDEX idx_txn_member_payment_franchise_id ON public.txn_member_payments(franchise_id);
CREATE INDEX idx_txn_member_payment_program_plan_id ON public.txn_member_payments(program_plan_id);
CREATE INDEX idx_txn_member_payment_program_id ON public.txn_member_payments(program_id);
CREATE INDEX idx_txn_member_payment_address_id ON public.txn_member_payments(address_id);
CREATE INDEX idx_txn_member_payment_billing_address_id ON public.txn_member_payments(billing_address_id);
CREATE INDEX idx_txn_member_payment_payment_mode_id ON public.txn_member_payments(payment_mode_id);
CREATE INDEX idx_txn_member_payment_payment_status_id ON public.txn_member_payments(payment_status_id);

CREATE INDEX idx_txn_member_franchise_id ON txn_members(franchise_id);
CREATE INDEX idx_txn_member_country_id ON txn_members(country_id);
CREATE INDEX idx_txn_member_nutritionist_id ON txn_members(nutritionist_id);
CREATE INDEX idx_txn_member_referrer_id ON txn_members(referrer_id);
CREATE INDEX idx_txn_member_active ON txn_members(active) WHERE active = true;