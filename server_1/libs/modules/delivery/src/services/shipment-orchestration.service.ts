import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ICreateShipmentPayload,
  IMemberAddressSnapshot,
  IRateQuoteWithPriority,
  IResolvedProviderWarehousePair,
  IShipment,
  ITrackingInfo,
  SHIPMENT_CONFIG,
  ShipmentStatusEnum,
} from '@eatfit247-shared-lib';
import { BookingRequestDto, BookingResponseDto, RateQuoteDto, RateRequestDto } from '../dto';
import { CourierFactory } from '../providers';
import { ShipmentRecordService } from './shipment-record.service';
import { RateSelectorService } from './rate-selector.service';
import { WarehouseResolverService } from './warehouse-resolver.service';
import { TxnShipment } from '../models';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberProduct } from '@server_1/modules/member/models';

@Injectable()
export class ShipmentOrchestrationService {
  private readonly logger = new Logger(ShipmentOrchestrationService.name);

  constructor(
    @InjectModel(TxnMemberProduct) private readonly orderRepository: typeof TxnMemberProduct,
    private readonly courierFactory: CourierFactory,
    private readonly shipmentRecordService: ShipmentRecordService,
    private readonly rateSelectorService: RateSelectorService,
    private readonly warehouseResolverService: WarehouseResolverService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC: Entry point — called from OrderService via setImmediate()
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Full automated flow: DRAFT → rates → select → book.
   * Never awaited by the HTTP request (fire-and-forget).
   * On failure → status=FAILED + next_retry_at set for cron pickup.
   */
  public async initiateFromOrder(
    orderId: number,
    createdBy: number,
    createdIp: string,
  ): Promise<void> {
    this.logger.log(`[Order:${orderId}] Shipment initiation started`);

    // Guard: already has a shipment for this order?
    const existing = await this.shipmentRecordService.getByOrderId(orderId);
    if (existing) {
      this.logger.warn(`[Order:${orderId}] Already has shipment ${existing.shipmentId} — skipping`);
      return;
    }

    // Step 1: Load order with member + items
    const order = await this.orderRepository.scope('details').findOne({
      where: { memberProductId: orderId },
    });
    if (!order) {
      this.logger.error(`[Order:${orderId}] Order not found — cannot initiate shipment`);
      return;
    }

    // Step 2: Extract delivery address from memberAddress JSONB snapshot
    //   Structure: { address: { postalAddress, cityVillage, pinCode, state, country }, billingAddress: {...} }
    const addressSnapshot = order.memberAddress as IMemberAddressSnapshot;
    const deliveryAddr = addressSnapshot?.address;

    if (!deliveryAddr?.pinCode) {
      this.logger.error(
        `[Order:${orderId}] No delivery pinCode in memberAddress — cannot create shipment`,
      );
      return;
    }

    const receiverName = `${order.member.firstName} ${order.member.lastName}`.trim();
    const receiverPhone = order.member.contactNumber ?? '';
    const receiverAddress = deliveryAddr.postalAddress ?? '';
    const receiverCity = deliveryAddr.cityVillage ?? '';
    const receiverState = deliveryAddr.state;
    const receiverPincode = deliveryAddr.pinCode;
    const receiverCountry = deliveryAddr.country;

    // Step 3: Build items payload from order items
    const items = (order.orderItems ?? []).map((item) => ({
      memberProductOrderItemId: item.memberProductOrderItemId,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      this.logger.error(`[Order:${orderId}] No order items — cannot create shipment`);
      return;
    }

    // Step 4: Create shipment record (DRAFT)
    const createPayload: ICreateShipmentPayload = {
      orderId,
      franchiseId: order.franchiseId,
      shipmentNumber: this.generateShipmentNumber(orderId),
      totalAmount: Number(order.totalAmount ?? 0),
      currency: order.currency,
      // Dimensions: null at creation — set from product data if available in future
      totalWeightKg: null,
      lengthCm: null,
      widthCm: null,
      heightCm: null,
      receiverName,
      receiverPhone,
      receiverAddress,
      receiverCity,
      receiverState,
      receiverPincode,
      receiverCountry,
      items,
      createdBy,
      createdIp,
    };

    let shipment: TxnShipment;
    try {
      shipment = await this.shipmentRecordService.createForOrder(createPayload);
    } catch (err: unknown) {
      this.logger.error(`[Order:${orderId}] Failed to create shipment record: ${this.errMsg(err)}`);
      return;
    }

    // Hand off to the booking flow
    await this.runBookingFlow(shipment, receiverPincode);
  }

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC: Cron retry — resumes from last known status
  // ────────────────────────────────────────────────────────────────────────

  public async retryBooking(
    shipmentId: number,
    request: BookingRequestDto = {},
  ): Promise<BookingResponseDto> {
    const shipment = await this.shipmentRecordService.getEntityById(shipmentId);

    // Determine where to resume based on last known status
    const resumeFrom = shipment.lastKnownStatus ?? ShipmentStatusEnum.DRAFT;

    this.logger.log(
      `[Shipment:${shipmentId}] Retrying from status=${resumeFrom} (attempt ${
        shipment.retryCount + 1
      })`,
    );

    // If we already have a selected quote, go straight to booking
    if (
      resumeFrom === ShipmentStatusEnum.RATE_SELECTED ||
      resumeFrom === ShipmentStatusEnum.BOOKING_REQUESTED
    ) {
      return this.bookWithSelectedQuote(shipment);
    }

    // Otherwise re-run the full flow from rates
    const pincode = shipment.receiverPincode ?? '';
    if (!pincode) {
      const msg = `Shipment ${shipmentId} has no receiver pincode — cannot retry`;
      await this.shipmentRecordService.markFailed(
        shipmentId,
        msg,
        (shipment.retryCount ?? 0) + 1,
        null,
      );
      return this.failedResponse(shipment, msg);
    }

    await this.runBookingFlow(shipment, pincode);

    // Return current state after flow
    const updated = await this.shipmentRecordService.getEntityById(shipmentId);
    return {
      shipmentId: updated.shipmentId,
      shipmentNumber: updated.shipmentNumber,
      status: updated.status,
      trackingNumber: updated.trackingNumber ?? undefined,
      trackingUrl: updated.trackingUrl ?? undefined,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC: Admin endpoints
  // ────────────────────────────────────────────────────────────────────────

  public async requestRates(shipmentId: number): Promise<RateQuoteDto[]> {
    const shipment = await this.shipmentRecordService.getEntityById(shipmentId);
    const pairs = await this.warehouseResolverService.resolvePairs(shipment);
    const rateReq = this.buildRateRequest(shipment);

    for (const pair of pairs) {
      await this.fetchAndSaveRatesForPair(shipment.shipmentId, pair, rateReq);
    }

    const saved = await this.shipmentRecordService.getRateQuotes(shipmentId);
    return saved.map((q) => this.toRateQuoteDto(q));
  }

  public async trackShipment(shipmentId: number): Promise<ITrackingInfo> {
    const shipment = await this.shipmentRecordService.getEntityById(shipmentId);
    if (!shipment.trackingNumber) {
      throw new NotFoundException(`Tracking number missing for shipment ${shipmentId}`);
    }
    if (!shipment.providerId) {
      throw new NotFoundException(`Provider missing for shipment ${shipmentId}`);
    }

    const pair = await this.warehouseResolverService.resolvePairByProvider(
      shipment,
      shipment.providerId,
    );
    if (!pair) {
      throw new NotFoundException(`Provider account not found for shipment ${shipmentId}`);
    }

    const adapter = this.courierFactory.getAdapter(pair.providerCode);
    const events = await adapter.trackShipment(shipment.trackingNumber, pair.credentials);
    await this.shipmentRecordService.saveTrackingEvents(shipmentId, events, 'POLLING');
    return this.shipmentRecordService.getTrackingInfo(shipmentId);
  }

  public async getShipment(shipmentId: number): Promise<IShipment> {
    return this.shipmentRecordService.getById(shipmentId);
  }

  // ────────────────────────────────────────────────────────────────────────
  // PRIVATE: Core booking flow (shared by initiateFromOrder + retry)
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Runs: serviceability → rates → select best → book.
   * Any step can throw; caller catches and marks FAILED.
   */
  private async runBookingFlow(shipment: TxnShipment, deliveryPincode: string): Promise<void> {
    const shipmentId = shipment.shipmentId;

    try {
      // ── Step A: Resolve warehouse-provider pairs ─────────────────────────
      const pairs = await this.warehouseResolverService.resolvePairs(shipment);
      if (pairs.length === 0) {
        throw new Error('No active warehouse-provider pairs found');
      }

      // Record the resolved warehouse on the shipment (first available)
      if (!shipment.warehouseId && pairs[0].warehouseId) {
        await this.shipmentRecordService.markWarehouseResolved(shipmentId, pairs[0].warehouseId);
      }

      // ── Step B: Fetch rates in parallel from all pairs ───────────────────
      const rateReq = this.buildRateRequest(shipment, deliveryPincode);

      await Promise.allSettled(
        pairs.map((pair) => this.fetchAndSaveRatesForPair(shipmentId, pair, rateReq)),
      );

      // ── Step C: Load all saved quotes and pick the best ──────────────────
      const savedQuotes = await this.shipmentRecordService.getRateQuotes(shipmentId);
      if (savedQuotes.length === 0) {
        throw new Error('No rate quotes returned from any provider — all may be unserviceable');
      }

      // Attach priorityOrder from the resolved pairs for sorting
      const quotesWithPriority: IRateQuoteWithPriority[] = savedQuotes.map((q) => {
        const matchedPair = pairs.find((p) => p.providerId === q.providerId);
        return {
          rateQuoteId: q.rateQuoteId,
          providerId: q.providerId,
          serviceCode: q.serviceName ?? '',
          serviceName: q.serviceName ?? '',
          rateAmount: Number(q.rateAmount),
          currency: q.currency,
          estimatedDays: q.estimatedDays ?? undefined,
          metadata: q.rawResponse ?? undefined,
          priorityOrder: matchedPair?.priorityOrder ?? 99,
        };
      });

      const best = this.rateSelectorService.pickBestQuote(quotesWithPriority);
      if (!best) {
        throw new Error('Rate selector returned no valid quote');
      }

      // ── Step D: Persist selection ────────────────────────────────────────
      await this.shipmentRecordService.selectRateQuote(shipmentId, best.rateQuoteId ?? 0);

      // Re-load shipment with updated provider/account fields
      const updatedShipment = await this.shipmentRecordService.getEntityById(shipmentId);

      // ── Step E: Book with selected provider ──────────────────────────────
      await this.bookWithSelectedQuote(updatedShipment);
    } catch (err: unknown) {
      const message = this.errMsg(err);
      const retryCount = (shipment.retryCount ?? 0) + 1;
      const nextRetryAt =
        retryCount >= SHIPMENT_CONFIG.MAX_RETRIES
          ? null
          : this.shipmentRecordService.computeNextRetryAt(retryCount);

      await this.shipmentRecordService.markFailed(shipmentId, message, retryCount, nextRetryAt);

      if (retryCount >= SHIPMENT_CONFIG.MAX_RETRIES) {
        this.logger.error(
          `[Shipment:${shipmentId}] Exhausted all ${SHIPMENT_CONFIG.MAX_RETRIES} retries. Manual intervention required.`,
        );
        // TODO: emit alert to admin notification service
      }
    }
  }

  /**
   * Books shipment using the already-selected rate quote.
   * Used by both runBookingFlow (step E) and retryBooking (RATE_SELECTED resume).
   */
  private async bookWithSelectedQuote(shipment: TxnShipment): Promise<BookingResponseDto> {
    const shipmentId = shipment.shipmentId;

    if (!shipment.providerId) {
      throw new NotFoundException(`Shipment ${shipmentId} has no provider set — cannot book`);
    }

    const pair = await this.warehouseResolverService.resolvePairByProvider(
      shipment,
      shipment.providerId,
    );
    if (!pair) {
      throw new NotFoundException(`Provider account not found for provider ${shipment.providerId}`);
    }

    await this.shipmentRecordService.markBookingRequested(shipmentId);

    try {
      const bookingPayload = this.buildBookingRequest(shipment, pair.providerWarehouseId);
      const adapter = this.courierFactory.getAdapter(pair.providerCode);
      const providerRes = await adapter.createShipment(bookingPayload, pair.credentials);

      const bookingResponse: BookingResponseDto = {
        shipmentId: shipment.shipmentId,
        shipmentNumber: shipment.shipmentNumber,
        status: ShipmentStatusEnum.BOOKED,
        providerId: pair.providerId,
        providerAccountId: pair.providerAccountId,
        providerShipmentId: providerRes.providerShipmentId,
        trackingNumber: providerRes.trackingNumber,
        trackingUrl: providerRes.trackingUrl,
        labelUrl: providerRes.labelUrl,
        awbNumber: providerRes.awbNumber,
        metadata: providerRes.metadata,
      };

      await this.shipmentRecordService.markBooked(
        shipmentId,
        bookingResponse,
        (shipment.metaData ?? {}) as unknown as Record<string, unknown>,
      );

      return bookingResponse;
    } catch (err: unknown) {
      const message = this.errMsg(err);
      const retryCount = (shipment.retryCount ?? 0) + 1;
      const nextRetryAt =
        retryCount >= SHIPMENT_CONFIG.MAX_RETRIES
          ? null
          : this.shipmentRecordService.computeNextRetryAt(retryCount);

      await this.shipmentRecordService.markFailed(shipmentId, message, retryCount, nextRetryAt);
      throw err; // re-throw so retryBooking can build the response
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PRIVATE: Rate fetch helpers
  // ────────────────────────────────────────────────────────────────────────

  private async fetchAndSaveRatesForPair(
    shipmentId: number,
    pair: IResolvedProviderWarehousePair,
    rateReq: RateRequestDto,
  ): Promise<void> {
    if (!pair.warehousePincode?.trim()) {
      this.logger.warn(
        `[Shipment:${shipmentId}] Skipping provider ${pair.providerCode} — no warehouse pincode`,
      );
      return;
    }

    try {
      // Each pair has its own warehouse — adapters require pickup postcode for rate API
      const rateReqWithPickup: RateRequestDto = {
        ...rateReq,
        pickup: {
          ...rateReq.pickup,
          postcode: pair.warehousePincode,
        },
        pickupPostcode: Number(pair.warehousePincode),
      };

      const adapter = this.courierFactory.getAdapter(pair.providerCode);
      const quotes = await adapter.getRates(rateReqWithPickup, pair.credentials);

      const normalised = quotes.map((q) => ({
        ...q,
        providerId: pair.providerId,
        providerName: pair.providerName,
      }));

      await this.shipmentRecordService.replaceRateQuotes(
        shipmentId,
        pair.providerAccountId,
        normalised,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `[Shipment:${shipmentId}] Rate fetch failed for provider ${
          pair.providerCode
        }: ${this.errMsg(err)}`,
      );
      // Non-fatal: other providers may still succeed
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PRIVATE: DTO builders
  // ────────────────────────────────────────────────────────────────────────

  private buildRateRequest(shipment: TxnShipment, deliveryPincode?: string): RateRequestDto {
    const pincode = deliveryPincode ?? shipment.receiverPincode ?? '';

    return {
      shipmentId: shipment.shipmentId,
      shipmentNumber: shipment.shipmentNumber,
      // Pickup postcode is set per-pair in fetchAndSaveRatesForPair from pair.warehousePincode
      pickup: {
        postcode: '',
        address: '',
        city: '',
        state: '',
        name: '',
        phone: '',
      },
      delivery: {
        postcode: pincode,
        address: shipment.receiverAddress ?? '',
        city: shipment.receiverCity ?? '',
        state: shipment.receiverState ?? '',
        name: shipment.receiverName ?? '',
        phone: shipment.receiverPhone ?? '',
        country: shipment.receiverCountry ?? 'India',
      },
      orderAmount: shipment.totalAmount ?? 0,
      subTotal: shipment.totalAmount ?? 0,
      codAmount: 0, // Prepaid only
      weight: shipment.totalWeightKg ?? 0.5,
      dimensions: shipment.lengthCm
        ? {
            length: shipment.lengthCm,
            breadth: shipment.widthCm ?? 10,
            width: shipment.widthCm ?? 10,
            height: shipment.heightCm ?? 10,
          }
        : undefined,
    };
  }

  private buildBookingRequest(
    shipment: TxnShipment,
    providerWarehouseId?: string,
  ): BookingRequestDto {
    return {
      ...this.buildRateRequest(shipment),
      providerId: shipment.providerId ?? undefined,
      providerAccountId: shipment.providerAccountId ?? undefined,
      orderId: String(shipment.orderId),
      orderNumber: shipment.shipmentNumber,
      pickupLocation: providerWarehouseId,
      metadata: (shipment.metaData ?? {}) as unknown as Record<string, unknown>,
    };
  }

  private toRateQuoteDto(quote: {
    rateQuoteId: number;
    providerId: number;
    providerAccountId: number;
    serviceName: string;
    rateAmount: number;
    currency: string;
    estimatedDays?: number;
    rawResponse?: Record<string, unknown>;
    isSelected: boolean;
  }): RateQuoteDto {
    return {
      rateQuoteId: quote.rateQuoteId,
      providerId: quote.providerId,
      providerAccountId: quote.providerAccountId,
      serviceCode: quote.serviceName,
      serviceName: quote.serviceName,
      rateAmount: Number(quote.rateAmount),
      currency: quote.currency,
      estimatedDays: quote.estimatedDays,
      metadata: quote.rawResponse ?? undefined,
      isSelected: quote.isSelected,
    };
  }

  private failedResponse(shipment: TxnShipment, message: string): BookingResponseDto {
    return {
      shipmentId: shipment.shipmentId,
      shipmentNumber: shipment.shipmentNumber,
      status: ShipmentStatusEnum.FAILED,
      message,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // PRIVATE: Utilities
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Generates a unique shipment number: SHP-{YYYYMMDD}-{orderId padded to 6}
   * e.g. SHP-20260307-000123
   */
  private generateShipmentNumber(orderId: number): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const idPart = String(orderId).padStart(6, '0');
    return `SHP-${datePart}-${idPart}`;
  }

  private errMsg(err: unknown): string {
    return err instanceof Error ? err.message : 'unknown error';
  }
}
