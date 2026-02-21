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
export class ShipwayAdapter extends BaseCourierAdapter {
  protected readonly providerCode = 'SHIPWAY';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  /**
   * Get shipping rates from Shipway API
   */
  async getRates(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]> {
    this.validateCredentials(credentials);

    try {
      const response = await this.makeRequest<any>(
        'POST',
        '/api/v1/rates',
        credentials,
        {
          origin_pincode: payload.pickup.postcode || payload.pickupPostcode,
          destination_pincode: payload.delivery.postcode || payload.deliveryPostcode,
          weight: payload.weight,
          cod_amount: payload.codAmount || 0,
          length: payload.dimensions?.length,
          width: payload.dimensions?.breadth || payload.dimensions?.width,
          height: payload.dimensions?.height,
        },
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new CourierProviderRateError(
          this.providerCode,
          'Invalid response format from Shipway rate API',
          null,
          { response },
        );
      }

      return response.data.map((rate: any) => ({
        serviceName: rate.service_name || rate.serviceName || 'Standard',
        serviceCode: rate.service_code || rate.serviceCode,
        rateAmount: parseFloat(rate.rate || rate.rate_amount || 0),
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
        `Failed to get rates from Shipway: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Create shipment with Shipway API
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
          order_id: payload.orderId,
          origin_pincode: payload.pickup.postcode || payload.pickupPostcode,
          destination_pincode: payload.delivery.postcode || payload.deliveryPostcode,
          origin_name: payload.pickup.name,
          origin_address: payload.pickup.address,
          origin_city: payload.pickup.city,
          origin_state: payload.pickup.state,
          origin_phone: payload.pickup.phone,
          destination_name: payload.delivery.name,
          destination_address: payload.delivery.address,
          destination_city: payload.delivery.city,
          destination_state: payload.delivery.state,
          destination_phone: payload.delivery.phone,
          weight: payload.weight,
          cod_amount: payload.codAmount || 0,
          length: payload.dimensions?.length,
          width: payload.dimensions?.breadth || payload.dimensions?.width,
          height: payload.dimensions?.height,
          items: payload.items.map((item: any) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      );

      if (!response.data || !response.data.shipment_id) {
        throw new CourierProviderShipmentError(
          this.providerCode,
          'Invalid response format from Shipway shipment API',
          null,
          { response },
        );
      }

      const shipment = response.data;

      return {
        providerShipmentId: shipment.shipment_id?.toString() || shipment.shipmentId?.toString() || '',
        trackingNumber: shipment.tracking_number || shipment.trackingNumber || shipment.awb_number || shipment.awbNumber || '',
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
        `Failed to create shipment with Shipway: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Track shipment with Shipway API
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

      if (!response.data) {
        throw new CourierProviderTrackingError(
          this.providerCode,
          'Invalid response format from Shipway tracking API',
          null,
          { response },
        );
      }

      const trackingData = response.data;
      const events: ITrackingEvent[] = [];

      // Handle different response formats
      if (Array.isArray(trackingData.events || trackingData.tracking)) {
        const eventList = trackingData.events || trackingData.tracking;
        for (const event of eventList) {
          events.push({
            status: event.status || event.event_status || 'UNKNOWN',
            description: event.description || event.event_description || event.message || '',
            eventTime: event.event_time
              ? new Date(event.event_time)
              : event.timestamp
                ? new Date(event.timestamp)
                : new Date(),
            location: event.location || event.city || undefined,
            metadata: {
              ...event,
            },
          });
        }
      } else if (trackingData.status) {
        // Single status response
        events.push({
          status: trackingData.status,
          description: trackingData.status_description || trackingData.description || '',
          eventTime: trackingData.updated_at
            ? new Date(trackingData.updated_at)
            : new Date(),
          location: trackingData.current_location || trackingData.location || undefined,
          metadata: {
            ...trackingData,
          },
        });
      }

      return events;
    } catch (error: any) {
      if (
        error instanceof CourierProviderAuthError ||
        error instanceof CourierProviderTrackingError
      ) {
        throw error;
      }
      throw new CourierProviderTrackingError(
        this.providerCode,
        `Failed to track shipment with Shipway: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Cancel shipment with Shipway API
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
        `Failed to cancel shipment with Shipway: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Refresh Shipway authentication token
   */
  protected async refreshToken(
    credentials: ICourierProviderCredentials,
  ): Promise<string> {
    try {
      const response = await this.makeRequest<{ access_token: string; expires_in: number }>(
        'POST',
        '/api/v1/auth/token',
        credentials,
        {
          api_key: credentials.apiKey,
          api_secret: credentials.apiSecret,
        },
      );

      if (!response.access_token) {
        throw new CourierProviderAuthError(
          this.providerCode,
          'refreshToken',
          'Token refresh response missing access_token',
        );
      }

      return response.access_token;
    } catch (error: any) {
      throw new CourierProviderAuthError(
        this.providerCode,
        'refreshToken',
        `Failed to refresh Shipway token: ${error.message}`,
        error,
      );
    }
  }
}
