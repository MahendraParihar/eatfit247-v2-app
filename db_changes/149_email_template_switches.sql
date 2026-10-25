-- =============================================================================
-- 149_email_template_switches.sql
-- Configurable tax treatment (roadmap 4.14), plan group 8 — spec:
-- specs/features/2026-10-25-configurable-tax-treatment/requirements.md, decision 18
-- =============================================================================
-- The welcome email gets a sender with this release (event member.created), so
-- its template ships switched off: member_welcome.active = false. An admin
-- activates it in the new Email Templates screen (EmailTemplate Update) when the
-- owner decides; nothing is deleted.
-- Its WhatsApp switch ships off too (group 8b): the message is free text, which
-- the WhatsApp Cloud API refuses for a contact who hasn't written first (a new
-- member never has). Switch it on once an approved WhatsApp template is used.
--
-- First run only, so a later run never switches off a template an admin has
-- activated: 149 marks its run in the comment on mst_email_templates.active,
-- written only when member_welcome exists (a later seed of the row then still
-- gets switched off by a re-run). A missing row is reported, not created.
-- Idempotent: a second run changes nothing.
-- =============================================================================

BEGIN;

DO
$$
DECLARE
    welcome RECORD;
BEGIN
    IF coalesce(col_description('public.mst_email_templates'::regclass,
                                (SELECT attnum FROM pg_attribute
                                 WHERE attrelid = 'public.mst_email_templates'::regclass AND attname = 'active')), '')
        NOT LIKE '%[149]%' THEN
        UPDATE public.mst_email_templates
        SET active                     = FALSE,
            send_whatsapp_notification = FALSE,
            updated_at                 = now()
        WHERE template_name = 'member_welcome';
        IF FOUND THEN
            COMMENT ON COLUMN public.mst_email_templates.active IS
                'Template on or off; switched in the admin Email Templates screen (EmailTemplate Update). [149] member_welcome shipped off.';
        END IF;
    END IF;
    SELECT active, send_email_notification, send_whatsapp_notification INTO welcome
    FROM public.mst_email_templates
    WHERE template_name = 'member_welcome';
    IF NOT FOUND THEN
        RAISE NOTICE 'Migration 149: no member_welcome template: the welcome email sends nothing until it is seeded.';
    ELSE
        RAISE NOTICE 'Migration 149: member_welcome active = %, email = %, WhatsApp = %.',
            welcome.active, welcome.send_email_notification, welcome.send_whatsapp_notification;
    END IF;
END
$$;

COMMIT;
