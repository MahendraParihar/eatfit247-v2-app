import { Injectable } from '@nestjs/common';
import { HttpService } from '@server_1/core';
import { BaseCourierAdapter } from './base-courier.adapter';
import {
  ICourierProviderCredentials,
  IRateQuote,
  IShipmentBookingResponse,
  IShipRocketServiceabilityPayload,
  IShipRocketServiceabilityResponse,
  ITrackingEvent,
} from '../courier.interface';

@Injectable()
export class ShiprocketAdapter extends BaseCourierAdapter {
  protected override readonly providerCode = 'SHIPROCKET';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  /**
   * Get authentication headers based on the auth type
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
        throw new Error(
          `${this.providerCode} getAuthHeaders Unsupported auth type: ${credentials.authType}`,
        );
    }
    return headers;
  }

  /**
   * Get shipping rates from Shiprocket API
   */
  async getRates(payload: any, credentials: ICourierProviderCredentials): Promise<IRateQuote[]> {
    try {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const ratePayload: IShipRocketServiceabilityPayload = {
        pickup_postcode: payload.pickup.postcode || payload.pickupPostcode,
        delivery_postcode: payload.delivery.postcode || payload.deliveryPostcode,
        weight: payload.weight,
        mode: 'cod',
      };
      // Add dimensions if provided
      if (payload.dimensions) {
        ratePayload.length = payload.dimensions.length;
        ratePayload.breadth = payload.dimensions.breadth;
        ratePayload.height = payload.dimensions.height;
      }
      const response = await this.httpService.post<IShipRocketServiceabilityResponse>(
        `${credentials.apiBaseUrl}/external/courier/serviceability`,
        ratePayload,
        undefined,
        headers,
      );

      if (!response.data || !response.data) {
        throw new Error(`${this.providerCode} Invalid response format rate API`);
      }

      const rates: IRateQuote[] = [];
      if (
        !response.data.available_courier_companies ||
        response.data.available_courier_companies.length === 0
      ) {
        return rates;
      }

      for (const rate of response.data.available_courier_companies) {
        rates.push({
          serviceName: rate.courier_name,
          serviceCode: rate.courier_company_id.toString(),
          rateAmount: rate.rate,
          currency: response.currency,
          estimatedDays: rate.estimated_delivery_days
            ? Number(rate.estimated_delivery_days)
            : undefined,
          metadata: {
            ...rate,
          },
        });
      }

      return rates;
    } catch (error: any) {
      throw new Error(`${this.providerCode} Failed to get rates: ${error.message}`);
    }
  }

  /**
   * Create shipment with Shiprocket API
   */
  async createShipment(
    payload: any,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse> {
    try {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const response = await this.httpService.post(
        `${credentials.apiBaseUrl}/orders/create/adhoc`,
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
        undefined,
        headers,
      );

      if (!response.shipment_id) {
        throw new Error(
          `${this.providerCode} Invalid response format from Shiprocket shipment API`,
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
      throw new Error(
        `${this.providerCode} Failed to create shipment with Shiprocket: ${error.message}`,
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
    try {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const response = await this.httpService.get(
        `${credentials.apiBaseUrl}/api/v1/courier/track/shipment/${trackingNumber}`,
        undefined,
        headers,
      );

      if (!response.data || !response.data.track_data) {
        throw new Error(`${this.providerCode} Invalid response format from tracking API`);
      }

      const trackData = response.data.track_data;
      const events: ITrackingEvent[] = [];

      if (trackData.tracking) {
        for (const event of trackData.tracking) {
          events.push({
            status: event.current_status || event.status || 'UNKNOWN',
            description: event.status_message || event.message || '',
            eventTime: event.updated_time ? new Date(event.updated_time) : new Date(),
            location: event.current_location || event.location || undefined,
            metadata: {
              ...event,
            },
          });
        }
      }

      return events;
    } catch (error: any) {
      throw new Error(
        `${this.providerCode} Failed to track shipment with Shiprocket: ${error.message}`,
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
    try {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      await this.httpService.post(
        `${credentials.apiBaseUrl}/api/v1/orders/cancel/shipment/awbs`,
        {
          awbs: [trackingNumber],
        },
        undefined,
        headers,
      );
    } catch (error: any) {
      throw new Error(
        `${this.providerCode} Failed to cancel shipment with Shiprocket: ${error.message}`,
      );
    }
  }

  protected override async refreshToken(credentials: ICourierProviderCredentials): Promise<string> {
    this.logger.log('Refreshing Shiprocket authentication token...');
    try {
      // According to documentation, use the Users->Login endpoint with email and password
      if (!credentials.username || !credentials.password || !credentials.apiBaseUrl) {
        throw new Error(
          `${this.providerCode} .refreshToken() called without username, password or apiBaseUrl`,
        );
      }
      // Use consistent API path structure: /api/v1/users/login
      const loginUrl = `${credentials.apiBaseUrl}/external/auth/login`;
      this.logger.debug(`Calling ${this.providerCode} login API: ${loginUrl}`);

      const responseData = await this.httpService.post(loginUrl, {
        email: credentials.username,
        password: credentials.password,
      });

      // Extract token from response - could be in data.token, data.accessToken, or just data
      const token =
        responseData?.token || responseData?.accessToken || responseData?.data || responseData;

      if (!token || (typeof token === 'string' && token.trim().length === 0)) {
        throw new Error(
          `${
            this.providerCode
          } refreshToken Token not found in login response. Response: ${JSON.stringify(
            responseData,
          )}`,
        );
      }

      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      credentials.authToken = tokenString;

      // Set token expiry (default to 24 hours from now if not provided in response)
      const expiresIn = responseData?.expiresIn || responseData?.expires_in || 24 * 60 * 60 * 1000; // Default 24 hours in milliseconds
      credentials.tokenExpiry = new Date(Date.now() + expiresIn);

      this.logger.log(`Successfully refreshed ${this.providerCode} authentication token`);
      return tokenString;
    } catch (error: any) {
      const errorMessage =
        error.data?.message || error.data?.error || error.message || 'Unknown error';
      throw new Error(`Failed to refresh ${this.providerCode} token: ${errorMessage}`);
    }
  }
}
