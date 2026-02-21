import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseCourierAdapter } from './base-courier.adapter';
import {
  ICourierProviderCredentials,
  IRateQuote,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '../courier.interface';
import {
  CourierProviderAuthError,
  CourierProviderCancellationError,
  CourierProviderRateError,
  CourierProviderShipmentError,
  CourierProviderTrackingError,
} from './courier-provider.error';

@Injectable()
export class NimbusAdapter extends BaseCourierAdapter {
  protected readonly providerCode = 'NIMBUS';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  /**
   * Get shipping rates from Nimbus API
   */
  async getRates(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]> {
    this.validateCredentials(credentials);

    try {
      // Nimbus rate API endpoint structure
      const response = await this.makeRequest<any>(
        'POST',
        '/api/v1/rates',
        credentials,
        {
          pickup: payload.pickup,
          delivery: payload.delivery,
          weight: payload.weight,
          dimensions: payload.dimensions,
          cod_amount: payload.codAmount,
        },
      );

      // Transform Nimbus response to IRateQuote[]
      if (!response.data || !Array.isArray(response.data)) {
        throw new CourierProviderRateError(
          this.providerCode,
          'Invalid response format from Nimbus rate API',
          null,
          { response },
        );
      }

      return response.data.map((rate: any) => ({
        serviceName: rate.service_name || rate.serviceName || 'Standard',
        serviceCode: rate.service_code || rate.serviceCode,
        rateAmount: parseFloat(rate.rate_amount || rate.rateAmount || 0),
        currency: rate.currency || 'INR',
        estimatedDays: rate.estimated_days || rate.estimatedDays,
        estimatedDeliveryDate: rate.estimated_delivery_date
          ? new Date(rate.estimated_delivery_date)
          : undefined,
        metadata: {
          providerRateId: rate.rate_id || rate.rateId,
          ...rate,
        },
      }));
    } catch (error: any) {
      if (error instanceof CourierProviderAuthError || error instanceof CourierProviderRateError) {
        throw error;
      }
      throw new CourierProviderRateError(
        this.providerCode,
        `Failed to get rates from Nimbus: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Create shipment with Nimbus API
   */
  async createShipment(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse> {
    this.validateCredentials(credentials);

    try {
      const response = await this.makeRequest<any>(
        'POST',
        '/api/v1/shipments',
        credentials,
        {
          pickup: payload.pickup,
          delivery: payload.delivery,
          weight: payload.weight,
          dimensions: payload.dimensions,
          cod_amount: payload.codAmount,
          order_id: payload.orderId,
          items: payload.items,
        },
      );

      if (!response.data) {
        throw new CourierProviderShipmentError(
          this.providerCode,
          'Invalid response format from Nimbus shipment API',
          null,
          { response },
        );
      }

      const shipment = response.data;

      return {
        providerShipmentId: shipment.shipment_id || shipment.shipmentId || '',
        trackingNumber: shipment.tracking_number || shipment.trackingNumber || '',
        trackingUrl: shipment.tracking_url || shipment.trackingUrl,
        labelUrl: shipment.label_url || shipment.labelUrl,
        awbNumber: shipment.awb_number || shipment.awbNumber,
        status: shipment.status || 'BOOKED',
        metadata: {
          ...shipment,
        },
      };
    } catch (error: any) {
      if (
        error instanceof CourierProviderAuthError ||
        error instanceof CourierProviderShipmentError
      ) {
        throw error;
      }
      throw new CourierProviderShipmentError(
        this.providerCode,
        `Failed to create shipment with Nimbus: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Track shipment with Nimbus API
   */
  async trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]> {
    this.validateCredentials(credentials);

    try {
      const response = await this.makeRequest<any>(
        'GET',
        `/api/v1/tracking/${trackingNumber}`,
        credentials,
      );

      if (!response.data || !Array.isArray(response.data.events || response.data)) {
        throw new CourierProviderTrackingError(
          this.providerCode,
          'Invalid response format from Nimbus tracking API',
          null,
          { response },
        );
      }

      const events = response.data.events || response.data;

      return events.map((event: any) => ({
        status: event.status || event.event_status || 'UNKNOWN',
        description: event.description || event.event_description || '',
        eventTime: event.event_time
          ? new Date(event.event_time)
          : event.timestamp
            ? new Date(event.timestamp)
            : new Date(),
        location: event.location || event.city || undefined,
        metadata: {
          ...event,
        },
      }));
    } catch (error: any) {
      if (
        error instanceof CourierProviderAuthError ||
        error instanceof CourierProviderTrackingError
      ) {
        throw error;
      }
      throw new CourierProviderTrackingError(
        this.providerCode,
        `Failed to track shipment with Nimbus: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Cancel shipment with Nimbus API
   */
  async cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void> {
    this.validateCredentials(credentials);

    try {
      await this.makeRequest<any>(
        'POST',
        `/api/v1/shipments/${trackingNumber}/cancel`,
        credentials,
        {
          reason: 'Customer request',
        },
      );
    } catch (error: any) {
      if (
        error instanceof CourierProviderAuthError ||
        error instanceof CourierProviderCancellationError
      ) {
        throw error;
      }
      throw new CourierProviderCancellationError(
        this.providerCode,
        `Failed to cancel shipment with Nimbus: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Refresh Nimbus authentication token
   */
  protected async refreshToken(
    credentials: ICourierProviderCredentials,
  ): Promise<string> {
    try {
      const response = await this.makeRequest<{ token: string; expires_in: number }>(
        'POST',
        '/api/v1/auth/refresh',
        credentials,
        {
          api_key: credentials.apiKey,
          api_secret: credentials.apiSecret,
        },
      );

      if (!response.token) {
        throw new CourierProviderAuthError(
          this.providerCode,
          'refreshToken',
          'Token refresh response missing token',
        );
      }

      // Note: In a real implementation, you would update the credentials in the database
      // This is handled by the service layer that calls the adapter

      return response.token;
    } catch (error: any) {
      throw new CourierProviderAuthError(
        this.providerCode,
        'refreshToken',
        `Failed to refresh Nimbus token: ${error.message}`,
        error,
      );
    }
  }
}
