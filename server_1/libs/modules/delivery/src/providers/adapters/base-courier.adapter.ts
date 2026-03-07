import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@server_1/core';
import {
  ICourierProviderCredentials,
  IRateQuote,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '@eatfit247-shared-lib';
import { BookingRequestDto, RateRequestDto } from '../../dto';
import { ICourierProvider } from '../courier.interface';

@Injectable()
export abstract class BaseCourierAdapter implements ICourierProvider {
  protected readonly logger: Logger;
  protected readonly providerCode: string;

  constructor(protected readonly httpService: HttpService, providerCode: string) {
    this.providerCode = providerCode;
    this.logger = new Logger(`${providerCode}Adapter`);
  }

  /**
   * Get shipping rates for a shipment
   */
  abstract getRates(
    payload: RateRequestDto,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]>;

  /**
   * Create/book a shipment
   */
  abstract createShipment(
    payload: BookingRequestDto,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse>;

  /**
   * Track a shipment by tracking number
   */
  abstract trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]>;

  /**
   * Cancel a shipment
   */
  abstract cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void>;

  /**
   * Ensure the token is valid, refresh if expired
   * Updates a credentials object with a new token after refresh
   * This method should be called before making any API calls that require authentication
   */
  protected async ensureValidToken(credentials: ICourierProviderCredentials): Promise<string> {
    // If authType is not JWT, token validation is not needed
    if (credentials.authType !== 'JWT') {
      return credentials.authToken || '';
    }

    const hasToken = credentials.authToken && credentials.authToken.trim().length > 0;

    if (hasToken) {
      if (!credentials.tokenExpiry) {
        this.logger.warn('Token expiry not set, refreshing to ensure validity...');
        const newToken = await this.refreshToken(credentials);
        credentials.authToken = newToken;
        return newToken;
      }
      // Check if the token is expired (with 5 min buffer)
      const expiryTime = new Date(credentials.tokenExpiry).getTime();
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const isExpired = expiryTime <= currentTime + bufferTime;
      if (!isExpired) {
        return credentials.authToken;
      }
    }
    this.logger.warn('Token expired or missing, refreshing...');
    const newToken = await this.refreshToken(credentials);
    credentials.authToken = newToken;
    return newToken;
  }

  protected async refreshToken(credentials: ICourierProviderCredentials): Promise<string> {
    throw new Error(
      `${this.providerCode} refreshToken Token refresh not implemented for this provider`,
    );
  }

  protected async executeWithLogging<T>(operation: string, executor: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.logger.log(`${operation} started`);
    try {
      const result = await executor();
      const elapsed = Date.now() - startTime;
      this.logger.log(`${operation} completed in ${elapsed}ms`);
      return result;
    } catch (error: unknown) {
      const elapsed = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`${operation} failed in ${elapsed}ms: ${message}`);
      throw error;
    }
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    context: string,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`${this.providerCode} ${context} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
