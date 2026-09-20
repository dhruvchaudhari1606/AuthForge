import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiSuccessResponse<unknown>> {
    void context;

    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        message: 'Request successful',
        data,
      })),
    );
  }
}
