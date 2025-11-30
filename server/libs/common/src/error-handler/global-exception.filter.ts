import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IError } from 'eatfit247-shared-lib';

@Injectable()
@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : exception.message.error;
    status = Object.values(HttpStatus).includes(exception.status) ? exception.status : status;
    this.logger.error(message, status);

    response.status(status).json({
      status,
      success: false,
      data: [],
      error: message,
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Sorry we are experiencing technical problems.'
          : exception.response?.message,
    }) as IError;
  }
}

