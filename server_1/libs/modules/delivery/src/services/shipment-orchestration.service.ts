import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  IBookingItem,
  IBookingRequest,
  ICreateShipmentPayload,
  IMemberAddressSnapshot,
  IRateQuote,
  IRateQuoteWithPriority,
  IRateRequest,
  IResolvedProviderWarehousePair,
  IShipment,
  ITrackingInfo,
  SHIPMENT_CONFIG,
  ShipmentStatusEnum,
} from '@eatfit247-shared-lib';
import { BookingResponseDto } from '../dto';
import { CourierFactory } from '../providers';
import { ShipmentRecordService } from './shipment-record.service';
import { RateSelectorService } from './rate-selector.service';
import { WarehouseResolverService } from './warehouse-resolver.service';
import { TxnShipment, TxnShipmentRateQuote } from '../models';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberProduct } from '@server_1/modules/member/models';
import { CommonFunctionsUtil } from '@server_1/core';

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

  /**
   * Converts a quantity value to kg. Catalogue policy: every shippable product
   * is stocked in weight units (kg / g / gm) only. Any other unit is bad
   * master data — failing loud here is preferable to silently shipping a
   * 0 kg package and letting carriers reject or mis-rate downstream.
   */
  private toKg(value: number, unit: string): number {
    const u = (unit ?? '').toLowerCase().trim();
    if (u === 'kg') return value;
    if (u === 'g' || u === 'gm') return value / 1000;
    throw new BadRequestException(
      `Unsupported quantity unit '${unit}' — products must be stocked in kg/g/gm only. ` +
        `Fix master data before this order can be shipped.`,
    );
  }

  /**
   * Sums order item weights in kg. Each item has quantityValue + quantityUnit (e.g. 100, 'gm');
   * multiplies by item quantity for total per line.
   */
  private calculateTotalWeight(order: TxnMemberProduct): number {
    let totalKg = 0;
    for (const item of order.orderItems ?? []) {
      const val = Number(item.quantityValue ?? 0);
      const qty = Math.max(0, Number(item.quantity ?? 1));
      totalKg += this.toKg(val, item.quantityUnit) * qty;
    }
    return totalKg;
  }

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
    createdBy: number | null,
    createdIp: string,
  ): Promise<void> {
    this.logger.log(`[Order:${orderId}] Shipment initiation started`);

    // Guard: already has an active shipment for this order? Allow rebook only
    // when the prior shipment ended in a terminal-failure state (CANCELLED or
    // FAILED) — those carry no live carrier booking, so a new shipment record
    // is the right action. The old shipment row stays as historical audit.
    const existing = await this.shipmentRecordService.getByOrderId(orderId);
    if (
      existing &&
      existing.status !== ShipmentStatusEnum.CANCELLED &&
      existing.status !== ShipmentStatusEnum.FAILED
    ) {
      this.logger.warn(
        `[Order:${orderId}] Already has active shipment ${existing.shipmentId} (status=${existing.status}) — skipping`,
      );
      return;
    }
    if (existing) {
      this.logger.log(
        `[Order:${orderId}] Prior shipment ${existing.shipmentId} is ${existing.status} — proceeding with rebook`,
      );
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
    const deliveryAddr = addressSnapshot.address
      ? addressSnapshot.address
      : addressSnapshot.billingAddress;

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

    // Step 4: Create shipment record (DRAFT). Suffix with a rebook sequence
    // number when prior shipments exist for this order — the shipment_number
    // column is uniquely indexed, and the date+orderId prefix alone is not
    // unique across rebooks of the same order on the same day.
    const priorCount = await this.shipmentRecordService.countByOrderId(orderId);
    const totalWeightKg = this.calculateTotalWeight(order);
    const createPayload: ICreateShipmentPayload = {
      orderId,
      franchiseId: order.franchiseId,
      shipmentNumber: this.generateShipmentNumber(orderId, priorCount),
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      totalWeightKg,
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

  public async retryBooking(shipmentId: number, key: string): Promise<BookingResponseDto> {
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

  public async requestRates(shipmentId: number): Promise<IRateQuote[]> {
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
    if (!shipment.courierProviderId) {
      throw new NotFoundException(`Provider missing for shipment ${shipmentId}`);
    }

    // Once local status is terminal (CANCELLED / DELIVERED / RTO), the carrier
    // won't produce further state changes — re-polling would only re-trigger
    // the synthetic-event path and grow duplicate tracking rows. Just return
    // the already-persisted tracking info.
    if (
      shipment.status === ShipmentStatusEnum.CANCELLED ||
      shipment.status === ShipmentStatusEnum.DELIVERED ||
      shipment.status === ShipmentStatusEnum.RTO
    ) {
      return this.shipmentRecordService.getTrackingInfo(shipmentId);
    }

    const pair = await this.warehouseResolverService.resolvePairByProvider(
      shipment,
      shipment.courierProviderId,
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

  /**
   * Admin-triggered cancel: hits the carrier (if AWB exists), then flips
   * local status to CANCELLED and appends a manual tracking event.
   * Throws if the shipment is already CANCELLED or DELIVERED.
   */
  public async cancelShipment(
    shipmentId: number,
    adminId: number,
    adminIp: string,
  ): Promise<IShipment> {
    const shipment = await this.shipmentRecordService.getEntityById(shipmentId);

    if (
      shipment.status === ShipmentStatusEnum.CANCELLED ||
      shipment.status === ShipmentStatusEnum.DELIVERED
    ) {
      throw new BadRequestException(
        `Shipment ${shipmentId} cannot be cancelled (status=${shipment.status})`,
      );
    }

    // Only call carrier if we actually booked one (have AWB + provider).
    if (shipment.trackingNumber && shipment.courierProviderId) {
      const pair = await this.warehouseResolverService.resolvePairByProvider(
        shipment,
        shipment.courierProviderId,
      );
      if (!pair) {
        throw new NotFoundException(`Provider account not found for shipment ${shipmentId}`);
      }
      const adapter = this.courierFactory.getAdapter(pair.providerCode);
      await adapter.cancelShipment(shipment.trackingNumber, pair.credentials);
      this.logger.log(
        `[Shipment:${shipmentId}] Carrier cancel acknowledged (AWB ${shipment.trackingNumber})`,
      );
    } else {
      this.logger.log(
        `[Shipment:${shipmentId}] No AWB/provider — skipping carrier cancel, local cancel only`,
      );
    }

    await this.shipmentRecordService.markCancelled(shipmentId, adminId, adminIp);
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

      this.logger.debug(
        `[Shipment:${shipmentId}] Resolved ${pairs.length} warehouse-provider pair(s)`,
      );

      // Record the resolved warehouse on the shipment (first available)
      if (!shipment.warehouseId && pairs[0].warehouseId) {
        await this.shipmentRecordService.markWarehouseResolved(shipmentId, pairs[0].warehouseId);
      }

      // ── Step B: Fetch rates in parallel from all pairs ───────────────────
      const rateReq = this.buildRateRequest(shipment, deliveryPincode);
      this.logger.debug(`[Shipment:${shipmentId}] Built rate request payload`);

      const results = await Promise.allSettled(
        pairs.map((pair) => this.fetchAndSaveRatesForPair(shipmentId, pair, rateReq)),
      );
      const providerErrors = results
        .map((r, i) =>
          r.status === 'rejected' ? `${pairs[i].providerCode}: ${this.errMsg(r.reason)}` : null,
        )
        .filter((x): x is string => x !== null);

      // ── Step C: Load all saved quotes and pick the best ──────────────────
      const savedQuotes = await this.shipmentRecordService.getRateQuotes(shipmentId);
      if (savedQuotes.length === 0) {
        const detail = providerErrors.length
          ? ` Provider errors: ${providerErrors.join(' | ')}`
          : '';
        throw new Error(`No rate quotes returned from any provider.${detail}`);
      }

      // Attach priorityOrder from the resolved pairs for sorting
      const quotesWithPriority: IRateQuoteWithPriority[] = savedQuotes.map((q) => {
        const matchedPair = pairs.find((p) => p.courierProviderId === q.courierProviderId);
        return {
          rateQuoteId: q.rateQuoteId,
          providerAccountId: q.providerAccountId,
          courierProviderId: q.courierProviderId,
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

      this.logger.log(
        `[Shipment:${shipmentId}] Selected best quote ${best.rateQuoteId} from provider account ${best.providerAccountId}`,
      );

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

    if (!shipment.courierProviderId) {
      throw new NotFoundException(`Shipment ${shipmentId} has no provider set — cannot book`);
    }

    // Defence against retrying a shipment that already produced an AWB. If
    // trackingNumber is set the carrier has already accepted this shipment;
    // calling createShipment again would either produce a duplicate AWB
    // (Nimbus does not server-enforce order_number uniqueness) or surface a
    // confusing duplicate-order error (Shiprocket/Shipway). Return the
    // existing booking and treat this call as a no-op.
    if (shipment.trackingNumber) {
      this.logger.warn(
        `[Shipment:${shipmentId}] bookWithSelectedQuote called with AWB already set ` +
          `(${shipment.trackingNumber}); skipping carrier call.`,
      );
      return {
        shipmentId: shipment.shipmentId,
        shipmentNumber: shipment.shipmentNumber,
        status: ShipmentStatusEnum.BOOKED,
        courierProviderId: shipment.courierProviderId,
        providerAccountId: shipment.providerAccountId,
        providerShipmentId: shipment.providerShipmentId ?? undefined,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl ?? undefined,
      };
    }

    const pair = await this.warehouseResolverService.resolvePairByProvider(
      shipment,
      shipment.courierProviderId,
    );
    if (!pair) {
      throw new NotFoundException(
        `Provider account not found for provider ${shipment.courierProviderId}`,
      );
    }

    await this.shipmentRecordService.markBookingRequested(shipmentId);

    try {
      this.logger.debug(`[Shipment:${shipmentId}] Building booking payload`);
      const bookingPayload = this.buildBookingRequest(shipment);
      const adapter = this.courierFactory.getAdapter(pair.providerCode);
      const providerRes = await adapter.createShipment(bookingPayload, pair.credentials);

      const bookingResponse: BookingResponseDto = {
        shipmentId: shipment.shipmentId,
        shipmentNumber: shipment.shipmentNumber,
        status: ShipmentStatusEnum.BOOKED,
        courierProviderId: pair.courierProviderId,
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
    rateReq: IRateRequest,
  ): Promise<void> {
    if (!pair.warehousePincode?.trim()) {
      throw new Error(`no warehouse pincode for provider ${pair.providerCode}`);
    }

    try {
      // Each pair has its own warehouse — adapters require pickup postcode for rate API
      const rateReqWithPickup: IRateRequest = {
        ...rateReq,
        pickup: {
          ...rateReq.pickup,
          pincode: pair.warehousePincode,
        },
        pickupPostcode: Number(pair.warehousePincode),
      };

      const adapter = this.courierFactory.getAdapter(pair.providerCode);
      const quotes = await adapter.getRates(rateReqWithPickup, pair.credentials);

      const normalised = quotes.map((q) => ({
        ...q,
        courierProviderId: pair.courierProviderId,
        providerName: pair.providerName,
      }));

      await this.shipmentRecordService.replaceRateQuotes(
        shipmentId,
        pair.providerAccountId,
        pair.courierProviderId,
        pair.warehouseId,
        normalised,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `[Shipment:${shipmentId}] Rate fetch failed for provider ${
          pair.providerCode
        }: ${this.errMsg(err)}`,
      );
      // Re-throw so Promise.allSettled records the reason for the aggregate error
      throw err;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PRIVATE: DTO builders
  // ────────────────────────────────────────────────────────────────────────

  private buildRateRequest(shipment: TxnShipment, deliveryPincode?: string): IRateRequest {
    const pincode = deliveryPincode ?? shipment.receiverPincode ?? '';
    const orderItems: IBookingItem[] = [];
    if (shipment.shipmentItems && shipment.shipmentItems.length > 0) {
      for (const s of shipment.shipmentItems) {
        orderItems.push(<IBookingItem>{
          name: s.memberProductOrderItem.productName,
          price: s.memberProductOrderItem.totalAmount,
          quantity: s.memberProductOrderItem.quantity,
          sku: `SKU${s.memberProductOrderItem.memberProductOrderItemId}`,
        });
      }
    }
    return <IRateRequest>{
      shipmentId: shipment.shipmentId,
      shipmentNumber: shipment.shipmentNumber,
      pickup: {
        pincode: '',
        address: '',
        city: '',
        state: '',
        name: '',
        phone: '',
      },
      delivery: {
        pincode: pincode,
        address: shipment.receiverAddress ?? '',
        city: shipment.receiverCity ?? '',
        state: shipment.receiverState ?? '',
        name: shipment.receiverName ?? '',
        phone: shipment.receiverPhone ?? '',
        country: shipment.receiverCountry ?? 'India',
      },
      orderAmount: shipment.totalAmount,
      codAmount: 0, // Prepaid only
      weight: shipment.totalWeightKg,
      items: orderItems,
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

  private buildBookingRequest(shipment: TxnShipment): IBookingRequest {
    return {
      ...this.buildRateRequest(shipment),
      // Stable carrier-facing order key. Reused on every retry so carriers
      // that enforce uniqueness (Shiprocket, Shipway) reject duplicates
      // server-side instead of issuing a second AWB.
      idempotencyKey: shipment.idempotencyKey,
      pickup: {
        address: shipment.warehouse.addressLine1,
        address2: shipment.warehouse.addressLine2,
        country: shipment.warehouse.country.country,
        city: shipment.warehouse.city,
        phone: shipment.warehouse.phone,
        state: shipment.warehouse.state.state,
        name: shipment.warehouse.name,
        email: shipment.warehouse.email,
        pincode: shipment.warehouse.pinCode,
      },
    };
  }

  private toRateQuoteDto(quote: TxnShipmentRateQuote): IRateQuote {
    return <IRateQuote>{
      rateQuoteId: quote.rateQuoteId,
      courierProviderId: quote.courierProviderId,
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
   * Generates a unique shipment number: SHP-{YYYYMMDD}-{orderId padded to 6}.
   * On rebook (priorCount > 0) appends -R{attempt} so the number stays unique
   * even when the same order is rebooked on the same day.
   *   e.g. first attempt: SHP-20260307-000123
   *        first rebook : SHP-20260307-000123-R2
   */
  private generateShipmentNumber(orderId: number, priorCount = 0): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const idPart = String(orderId).padStart(6, '0');
    const base = `SHP-${datePart}-${idPart}`;
    return priorCount > 0 ? `${base}-R${priorCount + 1}` : base;
  }

  private errMsg(err: unknown): string {
    if (!(err instanceof Error)) return 'unknown error';
    // Sequelize wraps validation/unique failures in a generic "Validation
    // error" message — unpack the inner per-field errors so the log actually
    // tells us which column blew up.
    const anyErr = err as any;
    const detailParts: string[] = [];
    if (Array.isArray(anyErr.errors)) {
      for (const e of anyErr.errors) {
        const path = e?.path ?? '?';
        const validatorKey = e?.validatorKey ?? '?';
        const value = e?.value === undefined ? 'undefined' : JSON.stringify(e.value);
        const msg = e?.message ?? '';
        detailParts.push(`${path}[${validatorKey}]=${value}: ${msg}`);
      }
    }
    if (anyErr.original?.detail) detailParts.push(`pg: ${anyErr.original.detail}`);
    if (anyErr.parent?.detail && anyErr.parent.detail !== anyErr.original?.detail) {
      detailParts.push(`pg: ${anyErr.parent.detail}`);
    }
    return detailParts.length > 0 ? `${err.message} — ${detailParts.join('; ')}` : err.message;
  }
}
