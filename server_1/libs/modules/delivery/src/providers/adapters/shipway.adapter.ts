import { Injectable } from '@nestjs/common';
import { HttpService } from '@server_1/core';
import { BaseCourierAdapter } from './base-courier.adapter';
import {
  IBookingRequest,
  ICourierProviderCredentials,
  IRateQuote,
  IRateRequest,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '@eatfit247-shared-lib';

/**
 * Shipway v1 adapter.
 *
 * Auth model: NOT JWT — every request body carries { username, password }
 * (the Licence Key). Set authType='API_KEY' on the provider row and store the
 * Licence Key in either `apiKey` or `password_encrypted` (we accept both).
 *
 * Public endpoints (relative to credentials.apiBaseUrl, e.g. https://app.shipway.com):
 *   POST /api/v2orders                 — push order + generate AWB (booking)
 *   POST /api/getOrderShipmentDetails  — pull tracking history for an AWB
 *   POST /api/cancelOrder              — cancel an order
 *
 * Rate API: Shipway exposes per-merchant carrier configurations via
 * /api/getCarriers — we map the merchant's configured carriers into rate
 * quotes since the rates themselves are set in the merchant dashboard, not
 * returned over the API.
 *
 * Status codes returned by tracking are short alpha (DEL, INT, OOD, ...).
 * The webhook strategy already understands them.
 */
@Injectable()
export class ShipwayAdapter extends BaseCourierAdapter {
  constructor(httpService: HttpService) {
    super(httpService, 'SHIPWAY');
  }

  protected async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private extractCredentials(credentials: ICourierProviderCredentials): {
    username: string;
    password: string;
  } {
    const username = (credentials.username || credentials.apiKey || '').trim();
    const password = (
      credentials.password ||
      credentials.apiSecret ||
      credentials.authToken ||
      ''
    ).trim();
    if (!username || !password) {
      throw new Error(
        `${this.providerCode} requires both username and Licence Key (stored as password)`,
      );
    }
    return { username, password };
  }

  async getRates(
    payload: IRateRequest,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]> {
    return this.executeWithLogging('getRates', async () => {
      const { username, password } = this.extractCredentials(credentials);
      const headers = await this.getAuthHeaders();

      const response = await this.withTimeout(
        this.httpService.post<{ status: string; message?: unknown; carriers?: unknown[] }>(
          `${credentials.apiBaseUrl}/api/getCarriers`,
          { username, password },
          undefined,
          headers,
        ),
        5_000,
        'rate/carrier fetch',
      );

      const carriers = Array.isArray(response?.carriers)
        ? (response.carriers as Record<string, unknown>[])
        : Array.isArray((response?.message as Record<string, unknown>[]) ?? null)
        ? (response?.message as Record<string, unknown>[])
        : [];

      if (carriers.length === 0) {
        this.logger.warn(
          `${this.providerCode} getCarriers returned no carriers — merchant dashboard may have none enabled`,
        );
        return [];
      }

      const orderAmount = Number(payload.orderAmount ?? 0);
      return carriers.map((c) => ({
        providerAccountId: credentials.providerAccountId,
        serviceName: String(c['carrier_name'] ?? c['name'] ?? 'Shipway Service'),
        serviceCode: String(c['carrier_id'] ?? c['id'] ?? ''),
        // Shipway does not return per-shipment rates over /getCarriers. Until a merchant-rate
        // endpoint is added, surface orderAmount as a placeholder rate so the selector treats
        // all Shipway carriers equally and falls back to priority_order to break ties.
        rateAmount: orderAmount,
        currency: 'INR',
        estimatedDays: undefined,
        estimatedDeliveryDate: undefined,
        metadata: { ...c },
      }));
    });
  }

  async createShipment(
    payload: IBookingRequest,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse> {
    return this.executeWithLogging('createShipment', async () => {
      const { username, password } = this.extractCredentials(credentials);
      const headers = await this.getAuthHeaders();

      const products = (payload.items ?? []).map((item) => ({
        product: item.name ?? 'Product',
        product_code: item.sku ?? '',
        quantity: Number(item.quantity ?? 1),
        price: Number(item.price ?? 0),
      }));

      // carrier_id is intentionally omitted — without it Shipway picks the
      // merchant's default carrier per their dashboard rules. To force a
      // specific carrier, extend IBookingRequest with serviceCode and pipe it
      // through ShipmentOrchestrationService.buildBookingRequest.
      const bookingPayload: Record<string, unknown> = {
        username,
        password,
        // Stable per-shipment UUID — Shipway enforces uniqueness on order_id.
        order_id:
          payload.idempotencyKey ??
          payload.shipmentId?.toString() ??
          payload.shipmentNumber ??
          '',
        order_date: new Date().toISOString().split('T')[0],
        first_name: payload.delivery.name,
        last_name: '',
        email: payload.delivery.email ?? '',
        phone: payload.delivery.phone,
        address: payload.delivery.address,
        address_2: payload.delivery.address2 ?? '',
        city: payload.delivery.city,
        state: payload.delivery.state,
        country: payload.delivery.country,
        pincode: String(payload.delivery.pincode),
        order_total: Number(payload.orderAmount ?? 0),
        payment_type: (payload.codAmount ?? 0) > 0 ? 'C' : 'P',
        cod_amount: Number(payload.codAmount ?? 0),
        package_weight: Number(payload.weight ?? 0.5) * 1000, // grams
        package_length: payload.dimensions?.length ?? 10,
        package_breadth: payload.dimensions?.breadth ?? payload.dimensions?.width ?? 10,
        package_height: payload.dimensions?.height ?? 10,
        warehouse_id: payload.pickup.name,
        products,
      };

      const response = await this.withTimeout(
        this.httpService.post<Record<string, unknown>>(
          `${credentials.apiBaseUrl}/api/pushOrderData`,
          bookingPayload,
          undefined,
          headers,
        ),
        10_000,
        'shipment booking',
      );

      const status = String(response?.['status'] ?? '').toLowerCase();
      if (status === 'error' || status === 'false' || status === '0') {
        const errMsg = response?.['message'] ?? response?.['error'] ?? 'Booking failed';
        throw new Error(`${this.providerCode} ${String(errMsg)}`);
      }

      const awb = String(
        response?.['awb'] ??
          response?.['awb_number'] ??
          (response?.['data'] as Record<string, unknown>)?.['awb'] ??
          '',
      );
      const providerShipmentId = String(
        response?.['order_id'] ??
          response?.['shipment_id'] ??
          (response?.['data'] as Record<string, unknown>)?.['order_id'] ??
          payload.shipmentId,
      );

      if (!awb) {
        throw new Error(`${this.providerCode} response missing AWB`);
      }

      return {
        providerShipmentId,
        trackingNumber: awb,
        // Shipway hosts merchant-specific tracking pages. We build a generic link;
        // the merchant can override with their white-labeled subdomain in DB if needed.
        trackingUrl: `https://trackingorder.shipway.com/track?awb=${encodeURIComponent(awb)}`,
        labelUrl:
          (response?.['label_url'] as string) ?? (response?.['shipping_label'] as string) ?? '',
        awbNumber: awb,
        status: String(response?.['status'] ?? 'BOOKED'),
        metadata: { ...response },
      };
    });
  }

  async trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]> {
    return this.executeWithLogging('trackShipment', async () => {
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        throw new Error(`${this.providerCode} Tracking number is required`);
      }
      const { username, password } = this.extractCredentials(credentials);
      const headers = await this.getAuthHeaders();

      const response = await this.withTimeout(
        this.httpService.post<{
          status?: string;
          response?: {
            current_status?: string;
            current_status_code?: string;
            time?: string;
            scan?: Array<{
              time?: string;
              location?: string;
              status_detail?: string;
              status_code?: string;
            }>;
          };
        }>(
          `${credentials.apiBaseUrl}/api/getOrderShipmentDetails`,
          { username, password, awb: trackingNumber.trim() },
          undefined,
          headers,
        ),
        10_000,
        'tracking fetch',
      );

      const root = response?.response;
      if (!root) {
        return [];
      }

      const scans = Array.isArray(root.scan) ? root.scan : [];
      if (scans.length === 0 && root.current_status) {
        return [
          {
            trackingEventId: 0,
            providerStatus: String(root.current_status_code ?? root.current_status ?? ''),
            internalStatus: '',
            status: String(root.current_status_code ?? root.current_status ?? ''),
            description: String(root.current_status ?? ''),
            eventTime: root.time ? new Date(root.time) : new Date(),
            location: undefined,
            metadata: { ...root },
          },
        ];
      }

      return scans.map((s) => ({
        trackingEventId: 0,
        providerStatus: String(s.status_code ?? root.current_status_code ?? ''),
        internalStatus: '',
        status: String(s.status_code ?? root.current_status_code ?? ''),
        description: String(s.status_detail ?? ''),
        eventTime: s.time ? new Date(s.time) : new Date(),
        location: s.location ?? undefined,
        metadata: { ...s },
      }));
    });
  }

  /**
   * Cancel shipment with Shipway API.
   * Endpoint: POST /api/Cancel/   body: { awb_number: [trackingNumber] }
   *
   * The previously-used `/api/cancelOrder` endpoint does not exist in Shipway's
   * documented API — calls were silently no-ops, which is why our DB flipped to
   * CANCELLED while the carrier kept the shipment active.
   *
   * Response shape per docs:
   *   success (HTTP 200): {
   *     error: false, success: true, message: "...",
   *     shipment_success_tracking_numbers: "<awb>",
   *     invalid_tracking_numbers: "",
   *     shipment_failed_tracking_numbers: ""
   *   }
   *   failure (HTTP 201): {
   *     error: true, success: false, message: "...",
   *     invalid_tracking_numbers: "<csv>"
   *   }
   */
  async cancelShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<void> {
    await this.executeWithLogging('cancelShipment', async () => {
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        throw new Error(`${this.providerCode} Tracking number is required for cancellation`);
      }
      const awb = trackingNumber.trim();
      const { username, password } = this.extractCredentials(credentials);
      const headers = await this.getAuthHeaders();

      const response = await this.withTimeout(
        this.httpService.post<{
          error?: boolean;
          success?: boolean;
          message?: string;
          invalid_tracking_numbers?: string;
          shipment_failed_tracking_numbers?: string;
          shipment_success_tracking_numbers?: string;
        }>(
          `${credentials.apiBaseUrl}/api/Cancel/`,
          { username, password, awb_number: [awb] },
          undefined,
          headers,
        ),
        10_000,
        'shipment cancellation',
      );
      this.logger.log(
        `Shipway cancel raw response for AWB ${awb}: ${JSON.stringify(response).slice(0, 1000)}`,
      );

      if (!response) {
        throw new Error(`${this.providerCode} empty response from Cancel API`);
      }
      const inCsv = (csv: string | undefined): boolean =>
        !!csv && csv.split(',').map((s) => s.trim()).includes(awb);
      if (
        response.error === true ||
        response.success === false ||
        inCsv(response.invalid_tracking_numbers) ||
        inCsv(response.shipment_failed_tracking_numbers)
      ) {
        throw new Error(
          `${this.providerCode} ${response.message ?? 'cancel rejected by Shipway'}`,
        );
      }
      if (!inCsv(response.shipment_success_tracking_numbers)) {
        throw new Error(
          `${this.providerCode} cancel response did not acknowledge AWB ${awb} as cancelled (msg: ${
            response.message ?? 'no message'
          })`,
        );
      }
    });
  }
}
