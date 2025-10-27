/**
 * Standard API response structure used across all services
 */
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ErrorDetails;
  meta?: ResponseMeta;
  requestId?: string;
}

/**
 * Error details structure
 */
export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
  method?: string;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  pagination?: PaginationMeta;
  timestamp: string;
  version?: string;
  processingTime?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
