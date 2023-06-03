DROP TABLE IF EXISTS log_errors;
CREATE TABLE IF NOT EXISTS log_errors
(
    error_id              SERIAL       NOT NULL PRIMARY KEY,
    environment           VARCHAR(1)   NOT NULL,
    browser               VARCHAR(100) NULL,
    host_url              VARCHAR(100) NULL,
    server_name           VARCHAR(50)  NULL,
    controller            VARCHAR(100) NULL,
    method_name           VARCHAR(100) NULL,
    exception_message     TEXT         NULL,
    exception_message_SQL TEXT         NULL,
    exception_type        VARCHAR(200) NULL,
    exception_source      VARCHAR(200) NULL,
    exception_target      VARCHAR(400) NULL,
    exception_stacktrace  TEXT         NULL,
    error_TIMESTAMP       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS mst_configs;
CREATE TABLE IF NOT EXISTS mst_configs
(
    config_id    SERIAL       NOT NULL PRIMARY KEY,
    config_name  VARCHAR(100) NOT NULL,
    config_value VARCHAR(200) NULL
);

INSERT INTO mst_configs (config_id, config_name, config_value)
values
    (1, 'GST_ENABLED', '0'),
    (2, 'CALL_LOG_ENABLED', '0'),
    (3, 'DIET_FEEDBACK_ENABLED', '0'),
    (4, 'SEND_WELCOME_MAIL', '0'),
    (5, 'SEND_DIET_MAIL', '0'),
    (6, 'IS_APP_AVAILABLE', '0'),
    (7, 'TAX_PERCENTAGE', 18),
    (8, 'DEFAULT_CURRENCY', 'INR');
