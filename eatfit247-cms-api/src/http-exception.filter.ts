import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { IServerResponse } from './common-dto/response-interface';
import { StringResource } from './enums/string-resource';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const s: IServerResponse = {
      code: status,
      message: exception['message'],
      data: null,
    };

    response.status(status).json(s);

    /*response
        .status(status)
        .json({
            statusCode: status,
            message: exception,
            timestamp: new Date().toISOString(),
            path: request.url,
        });*/
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const s: IServerResponse = {
      code: status,
      message: exception instanceof HttpException ? exception['message'] : StringResource.INTERNAL_SERVER_ERROR,
      data: null,
    };
    // TODO log exception
    response.status(status).json(s);

    /*response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        message: exception,
        path: request.url,
    });*/
  }
}
