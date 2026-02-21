import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ICourierProvider,
  ICourierProviderCredentials,
  IRateQuote,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '../courier.interface';
import { CourierProviderAuthError, CourierProviderError } from './courier-provider.error';

/**
 * Base adapter class with common functionality for all courier providers
 * Provides:
 * - Authentication handling
 * - Token refresh
 * - Response time logging
 * - Structured error handling
 */
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
  abstract getRates(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]>;

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
   * Get authentication headers based on auth type
   */
  protected async getAuthHeaders(
    credentials: ICourierProviderCredentials,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    switch (credentials.authType) {
      case 'API_KEY':
        if (credentials.apiKey) {
          headers['X-API-Key'] = credentials.apiKey;
        }
        if (credentials.apiSecret) {
          headers['X-API-Secret'] = credentials.apiSecret;
        }
        break;
      case 'JWT':
        const token = await this.ensureValidToken(credentials);
        headers['Authorization'] = `Bearer ${token}`;
        break;
      case 'BASIC':
        if (credentials.username && credentials.password) {
          const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString(
            'base64',
          );
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
      default:
        throw new CourierProviderAuthError(
          this.providerCode,
          'getAuthHeaders',
          `Unsupported auth type: ${credentials.authType}`,
        );
    }
    return headers;
  }

  /**
   * Ensure token is valid, refresh if expired
   */
  protected async ensureValidToken(
    credentials: ICourierProviderCredentials,
  ): Promise<string> {
    // Check if token exists and is not expired
    if (credentials.authToken) {
      const isExpired =
        credentials.tokenExpiry &&
        new Date(credentials.tokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000); // 5 min buffer
      if (!isExpired) {
        return credentials.authToken;
      }
    }
    // Token expired or missing, refresh it
    this.logger.warn('Token expired or missing, refreshing...');
    return await this.refreshToken(credentials);
  }

  /**
   * Refresh authentication token
   * Override in child classes for provider-specific token refresh logic
   */
  protected async refreshToken(
    credentials: ICourierProviderCredentials,
  ): Promise<string> {
    // Default implementation - child classes should override
    // This is a placeholder that should be implemented per provider
    throw new CourierProviderAuthError(
      this.providerCode,
      'refreshToken',
      'Token refresh not implemented for this provider',
    );
  }

  /**
   * Make HTTP request with logging and error handling
   */
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    credentials: ICourierProviderCredentials,
    data?: any,
    customHeaders?: Record<string, string>,
  ): Promise<T> {
    const startTime = Date.now();
    const operation = `${method} ${url}`;
    try {
      const headers = await this.getAuthHeaders(credentials);
      const finalHeaders = { ...headers, ...customHeaders };
      this.logger.debug(`Making ${operation} request`);
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${credentials.apiBaseUrl}${url}`,
          headers: finalHeaders,
          data,
          timeout: 30000, // 30 seconds timeout
        }),
      );
      const responseTime = Date.now() - startTime;
      this.logger.log(
        `${operation} completed in ${responseTime}ms with status ${response.status}`,
      );
      return response.data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status || 500;
      this.logger.error(
        `${operation} failed after ${responseTime}ms: ${errorMessage}`,
        error.stack,
      );
      // Handle authentication errors
      if (statusCode === 401 || statusCode === 403) {
        throw new CourierProviderAuthError(
          this.providerCode,
          operation,
          `Authentication failed: ${errorMessage}`,
          error,
        );
      }
      // Handle other HTTP errors
      throw new CourierProviderError(
        errorMessage,
        this.providerCode,
        operation,
        statusCode,
        error,
        {
          responseTime,
          statusCode,
          responseData: error.response?.data,
        },
      );
    }
  }

  /**
   * Validate credentials are present
   */
  protected validateCredentials(credentials: ICourierProviderCredentials): void {
    if (!credentials.apiBaseUrl) {
      throw new CourierProviderAuthError(
        this.providerCode,
        'validateCredentials',
        'API base URL is required',
      );
    }
    switch (credentials.authType) {
      case 'API_KEY':
        if (!credentials.apiKey) {
          throw new CourierProviderAuthError(
            this.providerCode,
            'validateCredentials',
            'API key is required for API_KEY auth type',
          );
        }
        break;
      case 'JWT':
        // JWT tokens can be refreshed, so we don't require them upfront
        break;
      case 'BASIC':
        if (!credentials.username || !credentials.password) {
          throw new CourierProviderAuthError(
            this.providerCode,
            'validateCredentials',
            'Username and password are required for BASIC auth type',
          );
        }
        break;
    }
  }
}

