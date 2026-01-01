import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse } from '@eatfit247-shared-lib';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If the result is already an IResponse, return it as is
        if (result && typeof result === 'object' && 'data' in result) {
          return result as IResponse<T>;
        }
        // Otherwise, wrap it in IResponse format
        return {
          data: result,
        } as IResponse<T>;
      }),
    );
  }
}

