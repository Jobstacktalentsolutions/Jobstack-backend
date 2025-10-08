import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ResponseUtil } from '../utils/response.utils';

@Injectable()
export class GenericResponseInterceptor implements NestInterceptor {
  constructor(private readonly serviceName: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();

        // If already in StandardResponse format, just add requestId
        if (data && typeof data === 'object' && 'success' in data) {
          const requestId = response.getHeader('x-request-id') as string;
          return { ...data, requestId };
        }

        // Wrap in standard format
        const requestId = response.getHeader('x-request-id') as string;
        const wrapped = ResponseUtil.success(data, undefined);
        wrapped.requestId = requestId;

        return wrapped;
      }),
    );
  }
}
