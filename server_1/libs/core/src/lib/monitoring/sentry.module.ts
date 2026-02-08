import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';

@Global()
@Module({})
export class SentryModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV') || 'development';

    if (dsn && environment === 'production') {
      Sentry.init({
        dsn,
        environment,
        tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
        profilesSampleRate: 0.1, // 10% of transactions for profiling
        // HTTP and Express integrations are automatically included in @sentry/nestjs v10
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['x-razorpay-signature'];
              delete event.request.headers['cookie'];
            }
            // Sanitize body
            if (event.request.data && typeof event.request.data === 'object' && !Array.isArray(event.request.data)) {
              const sensitiveFields = ['password', 'token', 'secret', 'key', 'cvv', 'card', 'pan'];
              const sanitized = { ...event.request.data };
              for (const field of sensitiveFields) {
                if (sanitized[field]) {
                  sanitized[field] = '***REDACTED***';
                }
              }
              event.request.data = sanitized;
            }
          }
          return event;
        },
      });
    }
  }
}

