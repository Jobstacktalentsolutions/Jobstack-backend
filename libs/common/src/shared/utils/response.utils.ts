import { GenericException } from '../exceptions/generic.exception';
import {
  PaginationMeta,
  ResponseMeta,
  StandardResponse,
} from '../interfaces/response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message = 'Success',
    meta?: Partial<ResponseMeta>,
  ): StandardResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env['API_VERSION'] || '1.0',
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    statusCode = 500,
    details?: Record<string, any>,
    field?: string,
    path?: string,
    method?: string,
  ): StandardResponse {
    const exception = new GenericException(
      code,
      message,
      statusCode,
      details,
      field,
      path,
      method,
    );
    return {
      success: false,
      error: exception.toErrorDetails(),
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env['API_VERSION'] || '1.0',
      },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    totalItems: number,
    message = 'Data retrieved',
    meta?: Partial<ResponseMeta>,
  ): StandardResponse<T[]> {
    const totalPages = Math.ceil(totalItems / limit);
    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
    return this.success(data, message, {
      ...meta,
      pagination,
    });
  }
}
