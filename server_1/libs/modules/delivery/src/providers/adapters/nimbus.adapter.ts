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
      this.logger.debug(
        `${this.providerCode} rate request payload`,
        typeof ratePayload === 'object' ? ratePayload : { ratePayload },
      );
      const response = await this.withTimeout(
        this.httpService.post<INimbusServiceabilityResponse>(
          `${credentials.apiBaseUrl}/courier/serviceability`,
          ratePayload,
          undefined,
          headers,
        ),
        15_000,
        'rate fetch',
      );
      // Nimbus returns { status: false, message: "..." } with no `data` when route is
      // unserviceable / weight invalid / COD disabled etc. Surface the real reason
      // instead of letting `.map` throw a useless TypeError that gets swallowed upstream.
      if (!response || response.status === false || !Array.isArray(response.data)) {
        const reason =
          (response as unknown as { message?: string })?.message ??
          `Nimbus serviceability returned no data (origin=${originPostcode}, destination=${destPostcode}, weight=${ratePayload.weight}g)`;
        throw new Error(`${this.providerCode} ${reason}`);
      }
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

      this.logger.debug(
        `${this.providerCode} booking payload`,
        typeof payload === 'object' ? payload : { payload },
      );

      // Build shipment request payload according to Nimbus API specification
      const shipmentPayload: INimbusShipmentPayload = {
        courier_id: 1,
        order_number: payload.shipmentId.toString(),
        payment_type: 'prepaid',
        order_amount: Number(payload.orderAmount),
        cod_charges: 0,
        package_weight: Number(payload.weight) * 1000,
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
      if (payload.items && payload.items.length > 0) {
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
      this.logger.debug(
        `${this.providerCode} shipment payload`,
        typeof shipmentPayload === 'object' ? shipmentPayload : { shipmentPayload },
      );
      const response = await this.withTimeout(
        this.httpService.post<INimbusShipmentResponse>(
          `${credentials.apiBaseUrl}/shipments`,
          shipmentPayload,
          undefined,
          headers,
        ),
        10_000,
        'shipment booking',
      );
      // httpService.post returns the parsed Nimbus body directly:
      //   { status: boolean, message: string, data: { shipment_id, awb_number, label, ... } }
      if (!response) {
        throw new Error(`${this.providerCode} Empty response from Nimbus shipment API`);
      }
      if (response.status === false || !response.data) {
        throw new Error(
          `${this.providerCode} ${response.message ?? 'shipment booking rejected (no data in response)'}`,
        );
      }
      const data = response.data;
      return {
        providerShipmentId: data.shipment_id.toString(),
        trackingNumber: data.awb_number,
        trackingUrl: '',
        labelUrl: data.label,
        awbNumber: data.awb_number,
        status: data.status,
        metadata: {
          ...response,
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
          `${credentials.apiBaseUrl}/shipments/track/${trackingNumber.trim()}`,
          undefined,
          headers,
        ),
        10_000,
        'tracking fetch',
      );
      // Diagnostic: log the raw Nimbus response so we can confirm the actual
      // shape (shipment_status field path, history field path) for each AWB.
      this.logger.log(
        `Nimbus track raw response for AWB ${trackingNumber}: ${JSON.stringify(response).slice(0, 1500)}`,
      );
      // Nimbus shape: { status, data: { order_number, shipment_status, history: [...] } }
      // Older/alternate shapes are also accepted to stay defensive.
      const events: any[] = Array.isArray(response)
        ? response
        : response?.data?.history ||
          response?.data?.events ||
          response?.events ||
          response?.data?.tracking ||
          response?.history ||
          response?.tracking ||
          (Array.isArray(response?.data) ? response.data : null) ||
          [];
      if (!Array.isArray(events)) {
        throw new Error(
          `${this.providerCode} Unexpected tracking response shape: ${JSON.stringify(response).slice(0, 500)}`,
        );
      }
      // Nimbus's top-level shipment_status is authoritative — when a shipment
      // is cancelled on the Nimbus admin portal, that field flips but the
      // history array doesn't necessarily get a new entry. Try multiple field
      // paths since Nimbus's track response shape isn't strictly nailed down.
      const shipmentStatus: string | undefined =
        response?.data?.shipment_status ||
        response?.data?.status ||
        response?.data?.current_status ||
        response?.data?.order_status ||
        response?.shipment_status ||
        response?.current_status ||
        response?.order_status;
      if (typeof shipmentStatus === 'string' && shipmentStatus.trim().length > 0) {
        const normalized = shipmentStatus.toUpperCase().replace(/[\s-]+/g, '_');
        const isTerminal = /CANCEL|DELIVER|RTO|RETURN|LOST|FAIL/.test(normalized);
        const alreadyInHistory = events.some((e) => {
          const eventStatus = (
            e?.status_code ||
            e?.status ||
            e?.event_status ||
            e?.current_status ||
            ''
          )
            .toString()
            .toUpperCase()
            .replace(/[\s-]+/g, '_');
          return eventStatus === normalized;
        });
        if (isTerminal && !alreadyInHistory) {
          // Use the carrier's own timestamp for when the state changed so the
          // synthesized event reflects when Nimbus cancelled the shipment, not
          // when the admin clicked refresh. Nimbus's track payload isn't
          // strictly schematized, so check the common field paths.
          const carrierTimestampRaw =
            response?.data?.cancelled_at ||
            response?.data?.cancellation_date ||
            response?.data?.cancelled_on ||
            response?.data?.cancel_date ||
            response?.data?.status_updated_at ||
            response?.data?.last_status_update ||
            response?.data?.updated_at ||
            response?.data?.last_updated ||
            response?.cancelled_at ||
            response?.updated_at ||
            null;
          let carrierTimestamp: Date | null = null;
          if (carrierTimestampRaw) {
            const parsed = new Date(carrierTimestampRaw);
            if (!isNaN(parsed.getTime())) {
              carrierTimestamp = parsed;
            }
          }
          // If the carrier didn't expose its own status-change timestamp, fall
          // back to the most recent history event's time (still carrier-side,
          // not the refresh click time). Only as a last resort use now().
          if (!carrierTimestamp && events.length > 0) {
            const historyTimestamps = events
              .map((e: any) => e?.event_time || e?.timestamp || e?.created_at || e?.date)
              .filter(Boolean)
              .map((v: any) => new Date(v))
              .filter((d: Date) => !isNaN(d.getTime()))
              .sort((a: Date, b: Date) => b.getTime() - a.getTime());
            if (historyTimestamps.length > 0) {
              // Bump by 1 second so it sorts strictly after the last history
              // entry without colliding on the unique (shipment, status, time).
              carrierTimestamp = new Date(historyTimestamps[0].getTime() + 1000);
            }
          }
          if (!carrierTimestamp) {
            carrierTimestamp = new Date();
            this.logger.warn(
              `Nimbus AWB ${trackingNumber} synthesizing "${shipmentStatus}" event with current time — no carrier timestamp found in response`,
            );
          }
          events.push({
            status: shipmentStatus,
            description: `Carrier shipment_status = ${shipmentStatus}`,
            event_time: carrierTimestamp.toISOString(),
            source: 'nimbus.shipment_status',
          });
          this.logger.log(
            `Nimbus AWB ${trackingNumber} top-level shipment_status="${shipmentStatus}" not in history — synthesized event at ${carrierTimestamp.toISOString()}`,
          );
        } else {
          this.logger.log(
            `Nimbus AWB ${trackingNumber} shipment_status="${shipmentStatus}" isTerminal=${isTerminal} alreadyInHistory=${alreadyInHistory}`,
          );
        }
      } else {
        this.logger.warn(
          `Nimbus AWB ${trackingNumber} no shipment_status field found in response (keys: ${
            response && typeof response === 'object' ? Object.keys(response).join(',') : typeof response
          }; data keys: ${
            response?.data && typeof response.data === 'object'
              ? Object.keys(response.data).join(',')
              : typeof response?.data
          })`,
        );
      }
      // If no events, return empty array (shipment might not be tracked yet)
      if (events.length === 0) {
        this.logger.warn(`No tracking events found for tracking number: ${trackingNumber}`);
        return [];
      }
      return events.map(
        (event: any) =>
          <ITrackingEvent>{
            status:
              event.status_code ||
              event.status ||
              event.event_status ||
              event.current_status ||
              'UNKNOWN',
            description:
              event.message ||
              event.description ||
              event.event_description ||
              event.remarks ||
              '',
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

      // Nimbus cancel API expects { "awb": "<single AWB string>" } — singular,
      // not an array. Sending { awbs: [...] } returns HTTP 200 with
      // status:false and the carrier silently does nothing.
      const cancelPayload = { awb: trackingNumber.trim() };
      const response = await this.withTimeout(
        this.httpService.post<{ status?: boolean; message?: string; data?: unknown }>(
          `${credentials.apiBaseUrl}/shipments/cancel`,
          cancelPayload,
          undefined,
          headers,
        ),
        10_000,
        'shipment cancellation',
      );
      this.logger.log(
        `Nimbus cancel raw response for AWB ${trackingNumber}: ${JSON.stringify(response).slice(0, 1000)}`,
      );
      // Nimbus returns HTTP 200 even on logical failure — body carries
      // status:false + a reason. Treat that as an error so the orchestration
      // layer doesn't flip our local row to CANCELLED while the carrier still
      // shows BOOKED.
      if (response && response.status === false) {
        throw new Error(
          `${this.providerCode} ${response.message ?? 'cancel rejected by carrier'}`,
        );
      }
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
