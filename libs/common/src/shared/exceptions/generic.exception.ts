import { HttpException } from '@nestjs/common';
import { ErrorDetails } from '../interfaces/response.interface';

/**
 * Generic exception class with enhanced error details
 */
export class GenericException extends HttpException {
  public readonly timestamp: string;

  constructor(
    public readonly code: string,
    public override readonly message: string,
    public readonly statusCode = 500,
    public readonly details?: Record<string, any>,
    public readonly field?: string,
    public readonly path?: string,
    public readonly method?: string,
  ) {
    super(message, statusCode);
    this.name = 'GenericException';
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GenericException);
    }
  }

  /**
   * Convert exception to error details format
   */
  toErrorDetails(): ErrorDetails {
    const errorDetails: ErrorDetails = {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
    };

    if (this.field !== undefined) {
      errorDetails.field = this.field;
    }
    if (this.details !== undefined) {
      errorDetails.details = this.details;
    }
    if (this.path !== undefined) {
      errorDetails.path = this.path;
    }
    if (this.method !== undefined) {
      errorDetails.method = this.method;
    }

    return errorDetails;
  }
}
