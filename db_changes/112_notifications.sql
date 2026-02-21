INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0', 'Whatsapp');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_API_TOKEN', 'XYZ', 'Whatsapp');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WHATSAPP_PHONE_NUMBER_ID', 'XYZ', 'Whatsapp');

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