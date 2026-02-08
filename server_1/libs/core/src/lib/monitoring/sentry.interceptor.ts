import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';
import { Env } from "../config/env.values";

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Capture exception in Sentry
        if (Env.nodeEnv === 'production' && Env.sentryDSN) {
          Sentry.captureException(error, {
            tags: {
              context: context.getClass().name,
              handler: context.getHandler().name,
            },
            extra: {
              request: context.switchToHttp().getRequest(),
            },
          });
        }
        throw error;
      }),
    );
  }
}

