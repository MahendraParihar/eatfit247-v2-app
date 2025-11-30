import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: AxiosError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception.response?.status || HttpStatus.BAD_GATEWAY;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      source: 'External API',
    });
  }
}