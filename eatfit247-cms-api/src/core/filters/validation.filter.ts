import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ValidationException } from './validation.exception';
import { IServerResponse } from '../../common-dto/response-interface';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const res: IServerResponse = {
      code: 400,
      message: 'ValidationFilter',
      data: exception.validationErrors,
    };
    return response.status(400).json(res);
  }
}
