import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Env } from "../config/env.values";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    console.log(exception)
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Structured logging with context
    const logContext = {
      status,
      message: exception instanceof Error ? exception.message : String(message),
      path: request.url,
      method: request.method,
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.get('user-agent'),
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
      // Don't log sensitive data
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
    };

    // Log based on severity
    if (status >= 500) {
      this.logger.error('Internal Server Error', logContext);
      // In production, send to error tracking service
      if (Env.nodeEnv === 'production' && Env.sentryDSN) {
        const Sentry = require('@sentry/nestjs');
        Sentry.captureException(exception, { extra: logContext });
      }
    } else if (status >= 400) {
      this.logger.warn('Client Error', logContext);
    } else {
      this.logger.log('Exception caught', logContext);
    }

    // Don't expose internal error details in production
    const responseMessage =
      Env.nodeEnv === 'production' && status >= 500 ? 'Internal server error' : message;

    response.status(status).json({
      code: status,
      message: responseMessage,
      data: null,
      path: request.url,
    });
  }

  /**
   * Sanitize request body to remove sensitive information before logging
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'cvv',
      'card',
      'pan',
      'account',
      'signature',
      'paymentId',
      'apiKey',
      'apiSecret',
    ];

    const sanitized = { ...body };
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

