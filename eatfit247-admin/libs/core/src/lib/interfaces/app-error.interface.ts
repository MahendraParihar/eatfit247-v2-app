import { HttpContextToken } from '@angular/common/http';

/**
 * Suppress the default error snackbar for a specific HTTP request.
 * Usage: httpService.get('/endpoint', { context: new HttpContext().set(SUPPRESS_ERROR_NOTIFICATION, true) })
 */
export const SUPPRESS_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

export type AppErrorKind = 'forbidden' | 'not-found' | 'validation' | 'server' | 'network' | 'unknown';

interface BaseAppError {
  kind: AppErrorKind;
  status: number;
  message: string;
  originalError: unknown;
}

export interface ForbiddenError extends BaseAppError {
  kind: 'forbidden';
  status: 403;
}

export interface NotFoundError extends BaseAppError {
  kind: 'not-found';
  status: 404;
}

export interface ValidationError extends BaseAppError {
  kind: 'validation';
  status: 400 | 422;
}

export interface ServerError extends BaseAppError {
  kind: 'server';
}

export interface NetworkError extends BaseAppError {
  kind: 'network';
  status: 0;
}

export interface UnknownAppError extends BaseAppError {
  kind: 'unknown';
}

export type AppError =
  | ForbiddenError
  | NotFoundError
  | ValidationError
  | ServerError
  | NetworkError
  | UnknownAppError;
