import { Injectable } from '@nestjs/common';
import { HttpService } from '@server_1/core';
import { BaseCourierAdapter } from './base-courier.adapter';
import {
  ICourierProviderCredentials,
  INimbusServiceabilityDataItem,
  INimbusServiceabilityPayload,
  INimbusServiceabilityResponse,
  IRateQuote,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '../courier.interface';

@Injectable()
export class NimbusAdapter extends BaseCourierAdapter {
  protected override readonly providerCode = 'NIMBUS';
  override readonly httpService: HttpService;

  constructor(httpService: HttpService) {
    super(httpService);
    this.httpService = httpService;
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
   * Ensure the token is valid, refresh if expired
   * Updates a credentials object with a new token after refresh
   */
  protected override async ensureValidToken(
    credentials: ICourierProviderCredentials,
  ): Promise<string> {
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
    // Token expired or missing, refresh it
    this.logger.warn('Token expired or missing, refreshing...');
    const newToken = await this.refreshToken(credentials);
    credentials.authToken = newToken;
    return newToken;
  }

  /**
   * Get shipping rates from Nimbus API
   * Endpoint: POST /api/v1/rates
   */
  async getRates(payload: any, credentials: ICourierProviderCredentials): Promise<IRateQuote[]> {
    try {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      // Build rate request payload according to Nimbus API specification
      const ratePayload: INimbusServiceabilityPayload = {
        order_amount: 700,
        payment_type: 'prepaid',
        origin: 400046,
        destination: 401101,
        weight: payload.weight,
      };
      // Add dimensions if provided
      if (payload.dimensions) {
        ratePayload.length = payload.dimensions.length;
        ratePayload.breadth = payload.dimensions.breadth;
        ratePayload.height = payload.dimensions.height;
      }
      const response = await this.httpService.post<INimbusServiceabilityResponse>(
        `${credentials.apiBaseUrl}/courier/serviceability`,
        ratePayload,
        undefined,
        headers,
      );
      return response.data.map((rate: INimbusServiceabilityDataItem) => ({
        serviceName: rate.name,
        serviceCode: null,
        rateAmount: rate.total_charges,
        currency: 'INR',
        estimatedDays: undefined,
        estimatedDeliveryDate: undefined,
        metadata: {
          ...rate,
        },
      }));
    } catch (error: any) {
      throw new Error(`${this.providerCode} Failed to get rates from : ${error.message}`);
    }
  }

  /**
   * Create shipment with Nimbus API
   * Endpoint: POST /api/v1/shipments
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

      // Calculate order_amount from items if not provided
      const orderAmount =
        payload.orderAmount ||
        payload.subTotal ||
        (payload.items &&
          payload.items.reduce(
            (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
            0,
          )) ||
        0;
      // Build shipment request payload according to Nimbus API specification
      const shipmentPayload: any = {
        order_id: payload.orderId,
        order_amount: orderAmount,
        origin_pincode: payload.pickup?.postcode || payload.pickupPostcode,
        destination_pincode: payload.delivery?.postcode || payload.deliveryPostcode,
        origin_name: payload.pickup?.name || payload.pickupName,
        origin_address: payload.pickup?.address || payload.pickupAddress,
        origin_city: payload.pickup?.city || payload.pickupCity,
        origin_state: payload.pickup?.state || payload.pickupState,
        origin_phone: payload.pickup?.phone || payload.pickupPhone,
        destination_name: payload.delivery?.name || payload.deliveryName,
        destination_address: payload.delivery?.address || payload.deliveryAddress,
        destination_city: payload.delivery?.city || payload.deliveryCity,
        destination_state: payload.delivery?.state || payload.deliveryState,
        destination_phone: payload.delivery?.phone || payload.deliveryPhone,
        weight: payload.weight || 1,
        cod_amount: payload.codAmount || 0,
      };
      // Add dimensions if provided
      if (payload.dimensions) {
        shipmentPayload.length = payload.dimensions.length || 10;
        shipmentPayload.breadth = payload.dimensions.breadth || payload.dimensions.width || 10;
        shipmentPayload.height = payload.dimensions.height || 10;
      }
      // Add email if provided
      if (payload.delivery?.email || payload.deliveryEmail) {
        shipmentPayload.destination_email = payload.delivery?.email || payload.deliveryEmail;
      }
      if (payload.pickup?.email || payload.pickupEmail) {
        shipmentPayload.origin_email = payload.pickup?.email || payload.pickupEmail;
      }
      // Add items if provided
      if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
        shipmentPayload.items = payload.items.map((item: any) => ({
          name: item.name || 'Product',
          sku: item.sku || item.productSku || '',
          quantity: item.quantity || 1,
          price: item.price || item.unitPrice || 0,
          weight: item.weight || item.weightKg || 0,
        }));
      }
      const response = await this.httpService.post(
        `${credentials.apiBaseUrl}/shipments`,
        shipmentPayload,
        undefined,
        headers,
      );
      const shipment = response?.data || response;
      if (!shipment) {
        throw new Error(`${this.providerCode} Invalid response format from Nimbus shipment API`);
      }
      return {
        providerShipmentId: shipment.shipment_id || shipment.shipmentId || shipment.id || '',
        trackingNumber:
          shipment.tracking_number ||
          shipment.trackingNumber ||
          shipment.awb_number ||
          shipment.awbNumber ||
          '',
        trackingUrl: shipment.tracking_url || shipment.trackingUrl || shipment.tracking_link,
        labelUrl: shipment.label_url || shipment.labelUrl || shipment.label,
        awbNumber: shipment.awb_number || shipment.awbNumber || shipment.awb,
        status: shipment.status || shipment.shipment_status || 'BOOKED',
        metadata: {
          ...shipment,
        },
      };
    } catch (error: any) {
      throw new Error(
        `${this.providerCode} Failed to create shipment with Nimbus: ${error.message}`,
      );
    }
  }

  /**
   * Track shipment with Nimbus API
   * Endpoint: GET /api/v1/tracking/{trackingNumber}
   */
  async trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]> {
    try {
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        throw new Error(`${this.providerCode} Tracking number is required`);
      }

      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const response = await this.httpService.get(
        `${credentials.apiBaseUrl}/api/v1/tracking/${trackingNumber.trim()}`,
        undefined,
        headers,
      );
      const events = Array.isArray(response)
        ? response
        : response?.data?.events ||
          response?.events ||
          response?.data?.tracking ||
          response?.data ||
          [];
      if (!Array.isArray(events)) {
        throw new Error(`${this.providerCode} Invalid response format from Nimbus tracking API`);
      }
      // If no events, return empty array (shipment might not be tracked yet)
      if (events.length === 0) {
        this.logger.warn(`No tracking events found for tracking number: ${trackingNumber}`);
        return [];
      }
      return events.map((event: any) => ({
        status: event.status || event.event_status || event.current_status || 'UNKNOWN',
        description:
          event.description || event.event_description || event.message || event.remarks || '',
        eventTime: event.event_time
          ? new Date(event.event_time)
          : event.timestamp
          ? new Date(event.timestamp)
          : event.created_at
          ? new Date(event.created_at)
          : event.date
          ? new Date(event.date)
          : new Date(),
        location:
          event.location || event.city || event.origin_city || event.destination_city || undefined,
        metadata: {
          ...event,
        },
      }));
    } catch (error: any) {
      throw new Error(
        `${this.providerCode} Failed to track shipment with Nimbus: ${error.message}`,
      );
    }
  }

  /**
   * Cancel shipment with Nimbus API
   * Endpoint: POST /api/v1/shipments/{trackingNumber}/cancel
   */
  async cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void> {
    try {
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        throw new Error(`${this.providerCode} Tracking number is required for cancellation`);
      }

      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const cancelPayload: any = {
        reason: 'Customer request',
      };
      // Some APIs require shipment_id instead of tracking number
      // Try with tracking number first, API will handle the mapping
      await this.httpService.post(
        `${credentials.apiBaseUrl}/api/v1/shipments/${trackingNumber.trim()}/cancel`,
        cancelPayload,
        undefined,
        headers,
      );
      this.logger.log(`Successfully cancelled shipment with tracking number: ${trackingNumber}`);
    } catch (error: any) {
      throw new Error(
        `${this.providerCode} Failed to cancel shipment with Nimbus: ${error.message}`,
      );
    }
  }

  protected override async refreshToken(credentials: ICourierProviderCredentials): Promise<string> {
    this.logger.log('Refreshing Nimbus authentication token...');
    try {
      // According to documentation, use the Users->Login endpoint with email and password
      if (!credentials.username || !credentials.password || !credentials.apiBaseUrl) {
        throw new Error(
          `${this.providerCode} .refreshToken() called without username, password or apiBaseUrl`,
        );
      }

      const loginUrl = `${credentials.apiBaseUrl}/users/login`;
      this.logger.debug(`Calling ${this.providerCode} login API: ${loginUrl}`);

      const responseData = await this.httpService.post<{ status: string; data: string }>(loginUrl, {
        email: credentials.username,
        password: credentials.password,
      });

      const token = responseData.data;

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

      this.logger.log(`Successfully refreshed ${this.providerCode} authentication token`);
      return tokenString;
    } catch (error: any) {
      const errorMessage =
        error.data?.message || error.data?.error || error.message || 'Unknown error';
      throw new Error(`Failed to refresh ${this.providerCode} token: ${errorMessage}`);
    }
  }
}
