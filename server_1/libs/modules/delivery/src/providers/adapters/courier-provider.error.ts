import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base error class for courier provider operations
 */
export class CourierProviderError extends HttpException {
  constructor(
    message: string,
    public readonly providerCode: string,
    public readonly operation: string,
    public readonly statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly originalError?: any,
    public readonly metadata?: Record<string, any>,
  ) {
    super(
      {
        message,
        providerCode,
        operation,
        metadata,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
    this.name = 'CourierProviderError';
  }
}

/**
 * Authentication error for courier providers
 */
export class CourierProviderAuthError extends CourierProviderError {
  constructor(
    providerCode: string,
    operation: string,
    message: string = 'Authentication failed',
    originalError?: any,
  ) {
    super(message, providerCode, operation, HttpStatus.UNAUTHORIZED, originalError);
    this.name = 'CourierProviderAuthError';
  }
}

/**
 * Rate request error
 */
export class CourierProviderRateError extends CourierProviderError {
  constructor(
    providerCode: string,
    message: string,
    originalError?: any,
    metadata?: Record<string, any>,
  ) {
    super(message, providerCode, 'getRates', HttpStatus.BAD_REQUEST, originalError, metadata);
    this.name = 'CourierProviderRateError';
  }
}

/**
 * Shipment creation error
 */
export class CourierProviderShipmentError extends CourierProviderError {
  constructor(
    providerCode: string,
    message: string,
    originalError?: any,
    metadata?: Record<string, any>,
  ) {
    super(message, providerCode, 'createShipment', HttpStatus.BAD_REQUEST, originalError, metadata);
    this.name = 'CourierProviderShipmentError';
  }
}

/**
 * Tracking error
 */
export class CourierProviderTrackingError extends CourierProviderError {
  constructor(
    providerCode: string,
    message: string,
    originalError?: any,
    metadata?: Record<string, any>,
  ) {
    super(message, providerCode, 'trackShipment', HttpStatus.BAD_REQUEST, originalError, metadata);
    this.name = 'CourierProviderTrackingError';
  }
}

/**
 * Cancellation error
 */
export class CourierProviderCancellationError extends CourierProviderError {
  constructor(
    providerCode: string,
    message: string,
    originalError?: any,
    metadata?: Record<string, any>,
  ) {
    super(message, providerCode, 'cancelShipment', HttpStatus.BAD_REQUEST, originalError, metadata);
    this.name = 'CourierProviderCancellationError';
  }
}

/**
 * Unsupported provider error
 * Thrown when a provider code is not supported by the factory
 */
export class CourierProviderUnsupportedError extends CourierProviderError {
  constructor(
    providerCode: string,
    supportedProviders?: string[],
    originalError?: any,
  ) {
    const message = `Unsupported courier provider: ${providerCode}. Supported providers: ${supportedProviders?.join(', ') || 'N/A'}`;
    super(
      message,
      providerCode,
      'getAdapter',
      HttpStatus.BAD_REQUEST,
      originalError,
      { supportedProviders },
    );
    this.name = 'CourierProviderUnsupportedError';
  }
}

