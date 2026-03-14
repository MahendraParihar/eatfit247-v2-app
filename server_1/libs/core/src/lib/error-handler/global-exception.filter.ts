import * as Sentry from '@sentry/nestjs';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Env } from '../config/env.values';

/**
 * Fields whose values are redacted from logs and error responses.
 * Stored lowercase; comparison is always .toLowerCase() so casing in the
 * payload makes no difference.
 */
const REDACT_KEYS = new Set([
  'password',
  'passwordtemp',
  'newpassword',
  'repeatpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'authtoken',
  'bearer',
  'secret',
  'key',
  'apikey',
  'apisecret',
  'cvv',
  'card',
  'pan',
  'account',
  'signature',
  'paymentid',
  'pin',
  'otp',
  'verificationcode',
]);

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const logContext = {
      status,
      message: exception instanceof Error ? exception.message : String(message),
      // request.path excludes the query string — tokens in URLs are not echoed
      path: request.path,
      method: request.method,
      ip: request.ip || request.socket?.remoteAddress,
      userAgent: request.get('user-agent'),
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
      body: this.sanitize(request.body),
      query: this.sanitize(request.query),
    };

    if (status >= 500) {
      this.logger.error('Internal Server Error', logContext);
      if (Env.nodeEnv === 'production' && Env.sentryDSN) {
        Sentry.captureException(exception, { extra: logContext });
      }
    } else if (status >= 400) {
      this.logger.warn('Client Error', logContext);
    } else {
      this.logger.log('Exception caught', logContext);
    }

    const responseMessage =
      Env.nodeEnv === 'production' && status >= 500 ? 'Internal server error' : message;

    response.status(status).json({
      code: status,
      message: responseMessage,
      data: null,
      // path uses request.path (no query string) so reset tokens in ?token=... are never echoed
      path: request.path,
    });
  }

  /**
   * Recursively sanitize a value.
   * - Objects: redact known sensitive keys (case-insensitive), recurse into others
   * - Arrays: recurse into each element
   * - Primitives: return as-is
   * - Depth cap at 8 to prevent runaway recursion on circular-ish structures
   */
  private sanitize(value: unknown, depth = 0): unknown {
    if (depth > 8 || value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((v) => this.sanitize(v, depth + 1));
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) =>
          REDACT_KEYS.has(k.toLowerCase())
            ? [k, '***REDACTED***']
            : [k, this.sanitize(v, depth + 1)],
        ),
      );
    }
    return value;
  }
}
