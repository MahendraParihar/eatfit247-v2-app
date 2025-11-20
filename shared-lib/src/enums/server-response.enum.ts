/**
 * Server Response Status Codes
 * Used across all EatFit247 applications for consistent API responses
 */
export enum ServerResponseEnum {
  SUCCESS = 200,
  CREATED = 201,
  UPDATED = 202,
  DELETED = 203,
  ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export enum AlertTypeEnum {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

