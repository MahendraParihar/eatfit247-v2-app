-- Create table for Admin User Forgot Password OTP
-- This table stores OTP codes generated for password reset requests

DROP TABLE IF EXISTS txn_admin_user_forgot_password_otp;

CREATE TABLE IF NOT EXISTS txn_admin_user_forgot_password_otp
(
    forgot_password_otp_id SERIAL      NOT NULL PRIMARY KEY,
    admin_id              INT         NOT NULL,
    otp                   VARCHAR(6)  NOT NULL,
    active                BOOLEAN     NOT NULL DEFAULT true,
    created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip            VARCHAR(50) NULL,
    CONSTRAINT fk_txn_admin_user_forgot_password_otp_mst_admin_admin_id 
        FOREIGN KEY (admin_id) REFERENCES mst_admin_users (admin_id)
);

-- Create index on admin_id for faster lookups
CREATE INDEX ix_txn_admin_user_forgot_password_otp_admin_id
    ON txn_admin_user_forgot_password_otp (admin_id);

-- Create index on active and admin_id for querying active OTPs
CREATE INDEX ix_txn_admin_user_forgot_password_otp_active_admin
    ON txn_admin_user_forgot_password_otp (admin_id, active);

-- Create index on created_at for OTP expiration queries
CREATE INDEX ix_txn_admin_user_forgot_password_otp_created_at
    ON txn_admin_user_forgot_password_otp (created_at);

-- Create composite index for finding active OTP by admin_id and otp
CREATE INDEX ix_txn_admin_user_forgot_password_otp_admin_otp_active
    ON txn_admin_user_forgot_password_otp (admin_id, otp, active);