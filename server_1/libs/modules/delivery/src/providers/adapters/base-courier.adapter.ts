import { Injectable, Logger } from '@nestjs/common';
import {
  ICourierProvider,
  ICourierProviderCredentials,
  IRateQuote,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '../courier.interface';
import { HttpService } from '@server_1/core';

@Injectable()
export abstract class BaseCourierAdapter implements ICourierProvider {
  protected readonly logger: Logger;
  protected readonly providerCode: string;

  constructor(protected readonly httpService: HttpService) {
    this.logger = new Logger(`${this.providerCode}Adapter`);
  }

  /**
   * Get shipping rates for a shipment
   */
  abstract getRates(payload: any, credentials: ICourierProviderCredentials): Promise<IRateQuote[]>;

  /**
   * Create/book a shipment
   */
  abstract createShipment(
    payload: any,
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
}
