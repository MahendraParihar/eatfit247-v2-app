import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { IServerResponse } from "./common-dto/response-interface";
import { StringResource } from "./enums/string-resource";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const s: IServerResponse = {
      code: status,
      message: exception instanceof HttpException ? exception.message : StringResource.INTERNAL_SERVER_ERROR,
      data: null,
      path: request.url
    };
    response.status(status).json(s);
  }
}