alter table txn_member_payments add column gst_number varchar(50);
alter table txn_addresses add column address_name varchar(100);
alter table txn_member_payments add column billing_address_id integer;

alter table txn_member_payments
    add constraint txn_member_payments_txn_addresses_address_id_fk
        foreign key (billing_address_id) references txn_addresses;