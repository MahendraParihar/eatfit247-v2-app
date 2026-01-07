// Database configuration
export * from './lib/database/db-config';
export * from './lib/database/model-registry';
export * from './lib/database/models';

// Configuration
export * from './lib/config/env.values';
export * from './lib/config/config.utils';
export * from './lib/config/app-config';

// Constants
export * from './lib/constants/config-constants';

// Decorators
export * from './lib/decorators/auth.decorator';
export * from './lib/decorators/user.decorator';
export * from './lib/decorators/requested-ip.decorator';
export { CurrentUser } from './lib/decorators/user.decorator';
export { RequestedIp } from './lib/decorators/requested-ip.decorator';

// Guards
export * from './lib/guards/jwt-auth.guard';
export * from './lib/guards/jwt.strategy';
export * from './lib/guards/recaptcha.guard';

// Auth
export * from './lib/auth/admin-user.service';

// Filters
export * from './lib/filters/validation.filter';
export * from './lib/filters/validation.exception';

// Error Handler
export * from './lib/error-handler/global-exception.filter';

// Interceptors
export * from './lib/interceptors/transform.interceptor';

// Health
export * from './lib/health/health.controller';

// Common Module
export * from './lib/common.module';

// Utils
export * from './lib/utils/crypto.util';
export * from './lib/utils/common-functions.utils';
export * from './lib/utils/search.util';
export * from './lib/utils/model-scopes.utils';
export { getCreatedByUserInclude, getUpdatedByUserInclude, CommonScopes } from './lib/utils/model-scopes.utils';

// Re-export DTOs from shared-dto for convenience
export { MediaUploadDto, SeoDto, CreateAddressDto } from '@server_1/shared-dto';

// Re-export EmailType from shared-dto
export { EmailType } from '@server_1/shared-dto';

// NOTE: Platform services should be imported directly from '@server_1/platform'
// to avoid circular dependencies (platform depends on core)

