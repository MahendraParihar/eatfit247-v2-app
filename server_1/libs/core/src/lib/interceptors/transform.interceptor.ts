import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse } from '@eatfit247-shared-lib';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((result) => {
        // If the result is already an IResponse with code, return it as is
        if (result && typeof result === 'object' && 'data' in result && 'code' in result) {
          return result as IResponse<T>;
        }
        // Otherwise, wrap it in IResponse format with code and message
        return {
          code: response.statusCode || 200,
          message: 'Success',
          data: result,
        } as IResponse<T>;
      }),
    );
  }
}

