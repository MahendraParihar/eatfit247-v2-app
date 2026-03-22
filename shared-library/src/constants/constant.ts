export const DEFAULT_PAGE_SIZE = 15;
export const LOG_ERROR = 'LOG_ERROR';
export const DEFAULT_DATE_FORMAT = 'DD-MMM-YYYY';
export const DEFAULT_DATE_TIME_FORMAT = 'DD-MMM-YYYY h:mm:ss A';
export const DB_DATE_TIME_FORMAT = 'YYYY-MM-DD h:mm:ss A';
export const DB_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_TIME_FORMAT = 'h:mm:ss';
export const DISPLAY_TIME_FORMAT = 'h:mm A';
export const PRIMARY_FRANCHISE = 1;
export const IN_COUNTRY_ID = 96;
export const ADMIN_USER_SHORT_INFO_ATTRIBUTE = ['adminId', 'firstName', 'lastName', 'profilePicture'];
export const DEFAULT_CONTACT_NUMBER_COUNTRY_CODE = '+91';
export const TEMPLATE_FOLDER = 'templates';

export const RECAPTCHA_REQUIRED = 'RECAPTCHA_REQUIRED';
export const RECAPTCHA_ACTION = 'RECAPTCHA_ACTION';
export const RECAPTCHA_SCORE_THRESHOLD = 'RECAPTCHA_SCORE_THRESHOLD';

export const PUBLIC_API = 'PUBLIC_API';

/** NestJS `@RequireAbility()` metadata key — checked by AbilitiesGuard. */
export const REQUIRE_ABILITY = 'REQUIRE_ABILITY';

export const SHIPMENT_CONFIG = {
    MAX_RETRIES: 3,
    BACKOFF_MINUTES: [5, 15, 60],       // per retry attempt
    SERVICEABILITY_CACHE_TTL_HRS: 12,
    RATE_QUOTE_VALIDITY_HRS: 24,
    BOOKING_TIMEOUT_MS: 10_000,
    RATE_FETCH_TIMEOUT_MS: 5_000,
} as const;