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
} from '@eatfit247-shared-lib';
import { BookingRequestDto, RateRequestDto, ShipmentAddressDto } from '../../dto';

@Injectable()
export class ShiprocketAdapter extends BaseCourierAdapter {
  constructor(httpService: HttpService) {
    super(httpService, 'SHIPROCKET');
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
  async getRates(
    payload: RateRequestDto,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]> {
    return this.executeWithLogging('getRates', async () => {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const pickupPostcode = Number(payload.pickup?.postcode ?? payload.pickupPostcode ?? 0);
      const deliveryPostcode = Number(payload.delivery?.postcode ?? payload.deliveryPostcode ?? 0);
      if (!pickupPostcode || !deliveryPostcode) {
        throw new Error(`${this.providerCode} getRates requires pickup and delivery postcodes`);
      }
      const ratePayload: IShipRocketServiceabilityPayload = {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight: payload.weight ?? 1,
        cod: (payload.codAmount ?? 0) > 0,
        mode: payload.dimensions?.mode ?? 'Surface',
      };
      // Add dimensions if provided
      if (payload.dimensions) {
        ratePayload.length = payload.dimensions.length;
        ratePayload.breadth = payload.dimensions.breadth;
        ratePayload.height = payload.dimensions.height;
      }
      const params: Record<string, string | number | boolean> = {
        pickup_postcode: ratePayload.pickup_postcode,
        delivery_postcode: ratePayload.delivery_postcode,
        weight: ratePayload.weight,
        cod: ratePayload.cod ?? false,
      };
      if (ratePayload.mode) params['mode'] = ratePayload.mode;
      if (ratePayload.length) params['length'] = ratePayload.length;
      if (ratePayload.breadth) params['breadth'] = ratePayload.breadth;
      if (ratePayload.height) params['height'] = ratePayload.height;

      const response = await this.withTimeout(
        this.httpService.get<IShipRocketServiceabilityResponse>(
          `${credentials.apiBaseUrl}/external/courier/serviceability`,
          params,
          headers,
        ),
        5_000,
        'rate fetch',
      );

      const responseData = response?.data;
      if (!responseData) {
        throw new Error(`${this.providerCode} Invalid response format rate API`);
      }

      const rates: IRateQuote[] = [];
      if (
        !responseData.available_courier_companies ||
        responseData.available_courier_companies.length === 0
      ) {
        return rates;
      }

      for (const rate of responseData.available_courier_companies) {
        rates.push({
          providerId: credentials.providerAccountId,
          serviceName: rate.courier_name,
          serviceCode: rate.courier_company_id.toString(),
          rateAmount: rate.rate,
          currency: response?.currency ?? 'INR',
          estimatedDays: rate.estimated_delivery_days
            ? Number(rate.estimated_delivery_days)
            : undefined,
          metadata: {
            ...rate,
          },
        });
      }

      return rates;
    });
  }

  /**
   * Create shipment with Shiprocket API
   */
  async createShipment(
    payload: BookingRequestDto,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse> {
    return this.executeWithLogging('createShipment', async () => {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const billing: Partial<ShipmentAddressDto> = payload.billing ?? payload.pickup ?? {};
      const shipping: Partial<ShipmentAddressDto> = payload.shipping ?? payload.delivery ?? {};
      const [billingFirstName, ...billingLastNameParts] = (billing.name ?? '').split(' ');
      const [shippingFirstName, ...shippingLastNameParts] = (shipping.name ?? '').split(' ');

      const orderItems = Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            name: item.name ?? 'Product',
            sku: item.sku ?? '',
            units: Number(item.quantity ?? 1),
            selling_price: Number(item.price ?? item.unitPrice ?? 0),
          }))
        : [];

      const requestBody = {
        order_id: payload.orderId ?? payload.orderNumber ?? '',
        order_date: payload.orderDate ?? new Date().toISOString().split('T')[0],
        pickup_location: payload.pickupLocation ?? 'Primary',
        billing_customer_name: billingFirstName ?? billing.name ?? '',
        billing_last_name: billingLastNameParts.join(' ') ?? billing.lastName ?? '',
        billing_address: billing.address ?? '',
        billing_address_2: billing.address2 ?? '',
        billing_city: billing.city ?? '',
        billing_pincode: billing.pincode ?? billing.postcode ?? '',
        billing_state: billing.state ?? '',
        billing_country: billing.country ?? 'India',
        billing_email: billing.email ?? '',
        billing_phone: billing.phone ?? '',
        shipping_is_billing: payload.shippingIsBilling ?? false,
        shipping_customer_name: shippingFirstName ?? shipping.name ?? '',
        shipping_last_name: shippingLastNameParts.join(' ') ?? shipping.lastName ?? '',
        shipping_address: shipping.address ?? '',
        shipping_address_2: shipping.address2 ?? '',
        shipping_city: shipping.city ?? '',
        shipping_pincode: shipping.pincode ?? shipping.postcode ?? '',
        shipping_state: shipping.state ?? '',
        shipping_country: shipping.country ?? 'India',
        shipping_email: shipping.email ?? '',
        shipping_phone: shipping.phone ?? '',
        order_items: orderItems,
        payment_method: (payload.codAmount ?? 0) > 0 ? 'COD' : 'Prepaid',
        sub_total: payload.subTotal ?? 0,
        length: payload.dimensions?.length ?? 10,
        breadth: payload.dimensions?.breadth ?? payload.dimensions?.width ?? 10,
        height: payload.dimensions?.height ?? 10,
        weight: payload.weight ?? 1,
      };

      const response = await this.withTimeout(
        this.httpService.post(
          `${credentials.apiBaseUrl}/orders/create/adhoc`,
          requestBody,
          undefined,
          headers,
        ),
        10_000,
        'shipment booking',
      );

      const shipmentId = response?.shipment_id ?? response?.data?.shipment_id ?? response?.order_id;
      const awbCode = response?.awb_code ?? response?.awb_number ?? response?.data?.awb_code ?? '';

      if (!shipmentId && !awbCode) {
        throw new Error(
          `${this.providerCode} Invalid response format from Shiprocket shipment API`,
        );
      }

      // Provider may return status: false/0 when booking fails - do not treat as success
      const rawStatus = response?.status ?? response?.data?.status;
      if (
        rawStatus === false ||
        rawStatus === 0 ||
        (typeof rawStatus === 'string' && rawStatus.toLowerCase() === 'false')
      ) {
        const errMsg =
          response?.message ?? response?.data?.message ?? response?.error ?? 'Booking failed';
        throw new Error(`${this.providerCode} ${errMsg}`);
      }

      return {
        providerShipmentId: String(shipmentId ?? awbCode ?? ''),
        trackingNumber: awbCode || response?.tracking_number || '',
        trackingUrl:
          response?.tracking_url ??
          (awbCode ? `https://shiprocket.co/tracking/${awbCode}` : undefined),
        labelUrl: response?.label_url ?? response?.label,
        awbNumber: awbCode || undefined,
        status: response?.status ?? 'NEW',
        metadata: { ...response },
      };
    });
  }

  /**
   * Track shipment with Shiprocket API
   * (apiBaseUrl in DB includes prefix e.g. /api/v1)
   */
  async trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]> {
    return this.executeWithLogging('trackShipment', async () => {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const response = await this.withTimeout(
        this.httpService.get(
          `${credentials.apiBaseUrl}/courier/track/shipment/${trackingNumber}`,
          undefined,
          headers,
        ),
        10_000,
        'tracking fetch',
      );

      if (!response.data || !response.data.track_data) {
        throw new Error(`${this.providerCode} Invalid response format from tracking API`);
      }

      const trackData = response.data.track_data;
      const events: ITrackingEvent[] = [];

      if (trackData.tracking) {
        for (const event of trackData.tracking) {
          events.push({
            trackingEventId: 1,
            internalStatus: event.status,
            providerStatus: event.status,
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
    });
  }

  /**
   * Cancel shipment with Shiprocket API
   * (apiBaseUrl in DB includes prefix e.g. /api/v1)
   */
  async cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void> {
    await this.executeWithLogging('cancelShipment', async () => {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      await this.withTimeout(
        this.httpService.post(
          `${credentials.apiBaseUrl}/orders/cancel/shipment/awbs`,
          {
            awbs: [trackingNumber],
          },
          undefined,
          headers,
        ),
        10_000,
        'shipment cancellation',
      );
    });
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
