import { Injectable } from '@nestjs/common';
import { HttpService } from '@server_1/core';
import { BaseCourierAdapter } from './base-courier.adapter';
import {
  IBookingRequest,
  ICourierProviderCredentials,
  INimbusServiceabilityDataItem,
  INimbusServiceabilityPayload,
  INimbusServiceabilityResponse,
  INimbusShipmentPayload,
  INimbusShipmentResponse,
  IRateQuote,
  IRateRequest,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '@eatfit247-shared-lib';

@Injectable()
export class NimbusAdapter extends BaseCourierAdapter {
  constructor(httpService: HttpService) {
    super(httpService, 'NIMBUS');
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
    const token = await this.ensureValidToken(credentials);
    headers['Authorization'] = `Bearer ${token}`;
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
  async getRates(
    payload: IRateRequest,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]> {
    return this.executeWithLogging('getRates', async () => {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      // Build rate request payload according to Nimbus API specification
      const originPostcode = Number(payload.pickup?.pincode ?? payload.pickupPostcode ?? 0);
      const destPostcode = Number(payload.delivery?.pincode ?? payload.deliveryPostcode ?? 0);
      if (!originPostcode || !destPostcode) {
        throw new Error(`${this.providerCode} getRates requires pickup and delivery postcodes`);
      }
      const ratePayload: INimbusServiceabilityPayload = {
        origin: originPostcode,
        destination: destPostcode,
        payment_type: (payload.codAmount ?? 0) > 0 ? 'cod' : 'prepaid',
        order_amount: payload.orderAmount,
        weight: Math.round(payload.weight * 1000),
      };
      // Add dimensions if provided
      if (payload.dimensions) {
        ratePayload.length = payload.dimensions.length ?? 10;
        ratePayload.breadth = payload.dimensions.breadth ?? payload.dimensions.width ?? 10;
        ratePayload.height = payload.dimensions.height ?? 10;
      }
      console.log(ratePayload);
      const response = await this.withTimeout(
        this.httpService.post<INimbusServiceabilityResponse>(
          `${credentials.apiBaseUrl}/courier/serviceability`,
          ratePayload,
          undefined,
          headers,
        ),
        5_000,
        'rate fetch',
      );
      return response.data.map((rate: INimbusServiceabilityDataItem) => ({
        providerAccountId: credentials.providerAccountId,
        serviceName: rate.name,
        serviceCode: rate.id ?? '',
        rateAmount: rate.total_charges,
        currency: 'INR',
        estimatedDays: undefined,
        estimatedDeliveryDate: undefined,
        metadata: {
          ...rate,
        },
      }));
    });
  }

  /**
   * Create shipment with Nimbus API
   * Endpoint: POST /api/v1/shipments
   */
  async createShipment(
    payload: IBookingRequest,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse> {
    return this.executeWithLogging('createShipment', async () => {
      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      console.log('----------------------------PAYLOAD');
      console.log(payload);

      // Build shipment request payload according to Nimbus API specification
      const shipmentPayload: INimbusShipmentPayload = {
        courier_id: 1,
        order_number: payload.shipmentId.toString(),
        payment_type: 'prepaid',
        order_amount: Number(payload.orderAmount),
        cod_charges: 0,
        package_weight: Number(payload.weight),
        consignee: {
          pincode: Number(payload.delivery.pincode),
          name: payload.delivery.name,
          address: payload.delivery.address,
          address_2: payload.delivery.address2,
          city: payload.delivery.city,
          state: payload.delivery.state,
          phone: payload.delivery.phone,
        },
        pickup: {
          warehouse_name: payload.pickup.name,
          name: payload.pickup.name,
          address: payload.pickup.address,
          address_2: payload.pickup.address2,
          city: payload.pickup.city,
          state: payload.pickup.state,
          pincode: Number(payload.pickup.pincode),
          phone: payload.pickup.phone,
        },
      };
      // Add items if provided
      if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
        shipmentPayload.order_items = payload.items.map((item: any) => ({
          name: item.name,
          sku: item.sku || item.productSku || '',
          qty: item.quantity,
          price: item.price || 0,
        }));
      }
      // Add dimensions
      if (payload.dimensions) {
        if (payload.dimensions.height) shipmentPayload.package_height = payload.dimensions.height;
        if (payload.dimensions.length) shipmentPayload.package_length = payload.dimensions.length;
        if (payload.dimensions.breadth)
          shipmentPayload.package_breadth = payload.dimensions.breadth;
      }
      console.log(shipmentPayload);
      const response = await this.withTimeout(
        this.httpService.post(
          `${credentials.apiBaseUrl}/shipments`,
          shipmentPayload,
          undefined,
          headers,
        ),
        10_000,
        'shipment booking',
      );
      console.log(response);
      const shipment = (response?.data || response) as INimbusShipmentResponse;
      if (!shipment) {
        throw new Error(`${this.providerCode} Invalid response format from Nimbus shipment API`);
      }
      // Provider may return status: false when booking fails - do not treat as success
      const rawStatus = shipment.status;
      if (rawStatus === false) {
        const errMsg = shipment.message;
        throw new Error(`${this.providerCode} ${errMsg}`);
      }
      return {
        providerShipmentId: shipment.data.shipment_id.toString(),
        trackingNumber: shipment.data.awb_number,
        trackingUrl: '',
        labelUrl: shipment.data.label,
        awbNumber: shipment.data.awb_number,
        status: shipment.data.status,
        metadata: {
          ...shipment,
        },
      };
    });
  }

  /**
   * Track shipment with Nimbus API
   * Endpoint: GET /tracking/{trackingNumber}
   * (apiBaseUrl in DB includes prefix e.g. /api/v1)
   */
  async trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]> {
    return this.executeWithLogging('trackShipment', async () => {
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        throw new Error(`${this.providerCode} Tracking number is required`);
      }

      // Ensure valid token before making API call
      await this.ensureValidToken(credentials);

      // Get authentication headers
      const headers = await this.getAuthHeaders(credentials);

      const response = await this.withTimeout(
        this.httpService.get(
          `${credentials.apiBaseUrl}/tracking/${trackingNumber.trim()}`,
          undefined,
          headers,
        ),
        10_000,
        'tracking fetch',
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
      return events.map(
        (event: any) =>
          <ITrackingEvent>{
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
              event.location ||
              event.city ||
              event.origin_city ||
              event.destination_city ||
              undefined,
            metadata: {
              ...event,
            },
          },
      );
    });
  }

  /**
   * Cancel shipment with Nimbus API
   * Endpoint: POST /shipments/{trackingNumber}/cancel
   * (apiBaseUrl in DB includes prefix e.g. /api/v1)
   */
  async cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void> {
    await this.executeWithLogging('cancelShipment', async () => {
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
      await this.withTimeout(
        this.httpService.post(
          `${credentials.apiBaseUrl}/shipments/${trackingNumber.trim()}/cancel`,
          cancelPayload,
          undefined,
          headers,
        ),
        10_000,
        'shipment cancellation',
      );
      this.logger.log(`Successfully cancelled shipment with tracking number: ${trackingNumber}`);
    });
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
