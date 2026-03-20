-- ============================================================
-- 114_email_templates_data.sql
-- Seed data for mst_email_templates (post 112_notifications migration)
-- Columns: template_name, subject, email_template_file, whatspp_template_file,
--          send_email_notification, send_whatsapp_notification, active,
--          created_by, modified_by
-- email_template_file  → relative path under templates/ without .ejs extension
-- whatspp_template_file → relative path under templates/ without .txt extension
-- ============================================================

-- ── MEMBER TEMPLATES ──────────────────────────────────────────────────────────

-- Welcome new member
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_welcome',
     'Welcome to {{franchiseName}}!',
     'member/welcome',
     'whatsapp/member/welcome',
     true, true, true, 1, 1);

-- Member password reset
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_reset_password',
     'Password Reset Request — {{franchiseName}}',
     'member/reset-password',
     NULL,
     true, false, true, 1, 1);

-- Member password changed successfully
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_success_password',
     'Your Password Has Been Changed — {{franchiseName}}',
     'member/success-password',
     NULL,
     true, false, true, 1, 1);

-- Diet plan assigned / updated
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_diet_plan',
     'Your Diet Plan Is Ready — {{franchiseName}}',
     'member/diet-plan',
     'whatsapp/member/diet-plan',
     true, true, true, 1, 1);

-- Plan payment invoice
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_plan_invoice',
     'Your Plan Invoice #{{invoiceNumber}} — {{franchiseName}}',
     'member/plan-invoice',
     'whatsapp/member/plan-invoice',
     true, true, true, 1, 1);

-- Product order confirmation
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_product_order',
     'Order Confirmed #{{orderNumber}} — {{franchiseName}}',
     'member/product-order',
     'whatsapp/member/product-order',
     true, true, true, 1, 1);

-- Product invoice
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_product_invoice',
     'Your Product Invoice #{{invoiceNumber}} — {{franchiseName}}',
     'member/product-invoice',
     'whatsapp/member/product-invoice',
     true, true, true, 1, 1);

-- Consultation call scheduled
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_call_scheduled',
     'Your Consultation Call Is Scheduled — {{franchiseName}}',
     'member/call-scheduled',
     'whatsapp/member/call-scheduled',
     true, true, true, 1, 1);

-- Consultation call rescheduled
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_call_rescheduled',
     'Your Consultation Call Has Been Rescheduled — {{franchiseName}}',
     'member/call-rescheduled',
     'whatsapp/member/call-rescheduled',
     true, true, true, 1, 1);

-- Consultation call cancelled
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_call_cancelled',
     'Your Consultation Call Has Been Cancelled — {{franchiseName}}',
     'member/call-cancelled',
     'whatsapp/member/call-cancelled',
     true, true, true, 1, 1);

-- Member inquiry resolved
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_inquiry_resolved',
     'Your Inquiry Has Been Resolved — {{franchiseName}}',
     'member/inquiry-resolved',
     'whatsapp/member/inquiry-resolved',
     true, true, true, 1, 1);

-- ── ADMIN TEMPLATES ───────────────────────────────────────────────────────────

-- Admin account welcome
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('admin_welcome',
     'Welcome to {{franchiseName}} Admin Portal',
     'admin/welcome',
     NULL,
     true, false, true, 1, 1);

-- Admin forgot password
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('admin_forgot_password',
     'Admin Password Reset Request — {{franchiseName}}',
     'admin/forgot-password',
     NULL,
     true, false, true, 1, 1);

-- Admin password changed successfully
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('admin_success_password',
     'Your Admin Password Has Been Changed — {{franchiseName}}',
     'admin/success-password',
     NULL,
     true, false, true, 1, 1);

-- ── CONTACT / INQUIRY TEMPLATES ───────────────────────────────────────────────

-- Admin notification when a new contact request is received
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('contact_admin_notification',
     'New Contact Request Received — {{franchiseName}}',
     'contact/admin-contact-notification',
     NULL,
     true, false, true, 1, 1);

-- Admin sends a response to the contact form submitter
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('contact_admin_response',
     'Response to Your Inquiry — {{franchiseName}}',
     'contact/admin-contact-response',
     NULL,
     true, false, true, 1, 1);

-- Acknowledgement sent to the person who submitted the contact form
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('contact_member_request',
     'We Have Received Your Request — {{franchiseName}}',
     'contact/member-contact-request',
     NULL,
     true, false, true, 1, 1);
