INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0', 'Whatsapp');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_API_TOKEN', 'XYZ', 'Whatsapp');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_PHONE_NUMBER_ID', 'XYZ', 'Whatsapp');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'XYZ', 'Whatsapp');

CREATE TABLE public.notification_logs
(
    id                  SERIAL PRIMARY KEY,
    member_id           INT,
    type                VARCHAR(50),
    channel             VARCHAR(20),
    status              VARCHAR(20),
    provider            VARCHAR(50),
    provider_message_id VARCHAR(255),
    attempts            INT       DEFAULT 0,
    idempotency_key     VARCHAR(255) UNIQUE,
    error               TEXT,
    payload             JSONB,
    response            JSONB,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

alter table public.mst_email_templates
    rename column body to email_template_file;

alter table public.mst_email_templates
    alter column email_template_file type varchar(200) using email_template_file::varchar(200);

alter table public.mst_email_templates
    add whatspp_template_file varchar(200);

alter table public.mst_email_templates
add column send_whatsapp_notification boolean default false,
add column send_email_notification boolean default false;

