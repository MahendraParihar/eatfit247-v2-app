import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ValidationException } from './validation.exception';
import { LogErrorService } from '../common/log-error.service';
import { ModuleRef } from '@nestjs/core';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  constructor(private moduleRef?: ModuleRef) {}

  async catch(exception: ValidationException, host: ArgumentsHost): Promise<any> {
    // Try to log error using LogErrorService if available
    try {
      if (this.moduleRef) {
        const logErrorService = this.moduleRef.get(LogErrorService, { strict: false });
        if (logErrorService) {
          await logErrorService.logError(
            exception instanceof Error ? exception : new Error(String(exception)),
            {
              controller: 'ValidationFilter',
              methodName: 'catch',
            },
          );
        }
      }
    } catch (error) {
      // Fallback: LogErrorService might not be available during early bootstrap
      // This is acceptable as GlobalExceptionsFilter will catch and log these errors
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const s = {
      code: status,
      message: exception instanceof HttpException ? exception.message : 'Internal server error',
      data: null,
      path: request.url,
    };
    response.status(status).json(s);
  }
}

