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
export class ShiprocketAdapter extends BaseCourierAdapter {
  protected readonly providerCode = 'SHIPROCKET';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  /**
   * Get shipping rates from Shiprocket API
   */
  async getRates(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]> {
    this.validateCredentials(credentials);

    try {
      const response = await this.makeRequest<any>(
        'POST',
        '/api/v1/external/courier/serviceability/rate',
        credentials,
        {
          pickup_postcode: payload.pickup.postcode || payload.pickupPostcode,
          delivery_postcode: payload.delivery.postcode || payload.deliveryPostcode,
          weight: payload.weight,
          cod: payload.codAmount > 0 ? 1 : 0,
        },
      );

      if (!response.data || !response.data.available_courier_companies) {
        throw new CourierProviderRateError(
          this.providerCode,
          'Invalid response format from Shiprocket rate API',
          null,
          { response },
        );
      }

      const rates: IRateQuote[] = [];

      for (const company of response.data.available_courier_companies) {
        for (const rate of company.rate || []) {
          rates.push({
            serviceName: rate.courier_name || company.courier_name || 'Standard',
            serviceCode: rate.courier_company_id?.toString() || company.courier_company_id?.toString(),
            rateAmount: parseFloat(rate.rate || 0),
            currency: 'INR',
            estimatedDays: rate.estimated_delivery_days || undefined,
            metadata: {
              courierCompanyId: company.courier_company_id,
              courierName: company.courier_name,
              ...rate,
            },
          });
        }
      }

      return rates;
    } catch (error: any) {
      if (error instanceof CourierProviderAuthError || error instanceof CourierProviderRateError) {
        throw error;
      }
      throw new CourierProviderRateError(
        this.providerCode,
        `Failed to get rates from Shiprocket: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Create shipment with Shiprocket API
   */
  async createShipment(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse> {
    this.validateCredentials(credentials);

    try {
      const response = await this.makeRequest<any>(
        'POST',
        '/api/v1/orders/create/adhoc',
        credentials,
        {
          order_id: payload.orderId,
          order_date: payload.orderDate || new Date().toISOString().split('T')[0],
          pickup_location: payload.pickupLocation || 'Primary',
          billing_customer_name: payload.billing.name,
          billing_last_name: payload.billing.lastName || '',
          billing_address: payload.billing.address,
          billing_address_2: payload.billing.address2 || '',
          billing_city: payload.billing.city,
          billing_pincode: payload.billing.pincode,
          billing_state: payload.billing.state,
          billing_country: payload.billing.country || 'India',
          billing_email: payload.billing.email,
          billing_phone: payload.billing.phone,
          shipping_is_billing: payload.shippingIsBilling || true,
          shipping_customer_name: payload.shipping.name,
          shipping_last_name: payload.shipping.lastName || '',
          shipping_address: payload.shipping.address,
          shipping_address_2: payload.shipping.address2 || '',
          shipping_city: payload.shipping.city,
          shipping_pincode: payload.shipping.pincode,
          shipping_state: payload.shipping.state,
          shipping_country: payload.shipping.country || 'India',
          shipping_email: payload.shipping.email,
          shipping_phone: payload.shipping.phone,
          order_items: payload.items.map((item: any) => ({
            name: item.name,
            sku: item.sku,
            units: item.quantity,
            selling_price: item.price,
          })),
          payment_method: payload.codAmount > 0 ? 'COD' : 'Prepaid',
          sub_total: payload.subTotal,
          length: payload.dimensions?.length,
          breadth: payload.dimensions?.breadth,
          height: payload.dimensions?.height,
          weight: payload.weight,
        },
      );

      if (!response.shipment_id) {
        throw new CourierProviderShipmentError(
          this.providerCode,
          'Invalid response format from Shiprocket shipment API',
          null,
          { response },
        );
      }

      return {
        providerShipmentId: response.shipment_id?.toString() || '',
        trackingNumber: response.awb_code || response.tracking_number || '',
        trackingUrl: response.tracking_url || `https://shiprocket.co/tracking/${response.awb_code}`,
        labelUrl: response.label_url,
        awbNumber: response.awb_code,
        status: response.status || 'NEW',
        metadata: {
          ...response,
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
        `Failed to create shipment with Shiprocket: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Track shipment with Shiprocket API
   */
  async trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]> {
    this.validateCredentials(credentials);

    try {
      const response = await this.makeRequest<any>(
        'GET',
        `/api/v1/courier/track/shipment/${trackingNumber}`,
        credentials,
      );

      if (!response.data || !response.data.track_data) {
        throw new CourierProviderTrackingError(
          this.providerCode,
          'Invalid response format from Shiprocket tracking API',
          null,
          { response },
        );
      }

      const trackData = response.data.track_data;
      const events: ITrackingEvent[] = [];

      if (trackData.tracking) {
        for (const event of trackData.tracking) {
          events.push({
            status: event.current_status || event.status || 'UNKNOWN',
            description: event.status_message || event.message || '',
            eventTime: event.updated_time
              ? new Date(event.updated_time)
              : new Date(),
            location: event.current_location || event.location || undefined,
            metadata: {
              ...event,
            },
          });
        }
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
        `Failed to track shipment with Shiprocket: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Cancel shipment with Shiprocket API
   */
  async cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void> {
    this.validateCredentials(credentials);

    try {
      await this.makeRequest<any>(
        'POST',
        '/api/v1/orders/cancel/shipment/awbs',
        credentials,
        {
          awbs: [trackingNumber],
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
        `Failed to cancel shipment with Shiprocket: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Refresh Shiprocket authentication token
   */
  protected async refreshToken(
    credentials: ICourierProviderCredentials,
  ): Promise<string> {
    try {
      const response = await this.makeRequest<{ token: string }>(
        'POST',
        '/api/v1/external/auth/login',
        credentials,
        {
          email: credentials.username,
          password: credentials.password,
        },
      );

      if (!response.token) {
        throw new CourierProviderAuthError(
          this.providerCode,
          'refreshToken',
          'Token refresh response missing token',
        );
      }

      return response.token;
    } catch (error: any) {
      throw new CourierProviderAuthError(
        this.providerCode,
        'refreshToken',
        `Failed to refresh Shiprocket token: ${error.message}`,
        error,
      );
    }
  }
}
