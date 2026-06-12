import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID } from 'node:crypto';
import { BasicSearchDto, CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import {
  ICreateShipmentPayload,
  IRateQuote,
  IShipment,
  ITableList,
  ITrackingEvent,
  ITrackingInfo,
  SHIPMENT_CONFIG,
  ShipmentStatusEnum,
  ShipmentTrackingEnum,
  ShipmentTrackingSourceEnum,
} from '@eatfit247-shared-lib';
import {
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentRateQuote,
  TxnShipmentTrackingEvent,
} from '../models';
import { BookingResponseDto } from '../dto';

/**
 * Payload for the 'shipment.status.changed' event.
 * Subscribers: ShipmentNotificationListener (member-facing email/WhatsApp).
 */
export interface IShipmentStatusChangedEvent {
  shipmentId: number;
  orderId: number;
  previousStatus: string | null;
  newStatus: string;
  awbNumber?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  source: 'BOOKING' | 'WEBHOOK' | 'POLLING' | 'MANUAL';
}

@Injectable()
export class ShipmentRecordService {
  private readonly logger = new Logger(ShipmentRecordService.name);

  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentRepository: typeof TxnShipment,
    @InjectModel(TxnShipmentItem)
    private readonly shipmentItemRepository: typeof TxnShipmentItem,
    @InjectModel(TxnShipmentRateQuote)
    private readonly rateQuoteRepository: typeof TxnShipmentRateQuote,
    @InjectModel(TxnShipmentTrackingEvent)
    private readonly trackingRepository: typeof TxnShipmentTrackingEvent,
    private readonly eventEmitter: EventEmitter2,
    private readonly sequelize: Sequelize,
  ) {}

  // ── Creation ──────────────────────────────────────────────────────────────

  /**
   * Creates the initial DRAFT shipment + items from an order.
   * Called by ShipmentOrchestrationService.initiateFromOrder().
   */
  public async createForOrder(payload: ICreateShipmentPayload): Promise<TxnShipment> {
    const shipment = await this.shipmentRepository.create({
      idempotencyKey: randomUUID(),
      orderId: payload.orderId,
      franchiseId: payload.franchiseId,
      shipmentNumber: payload.shipmentNumber,
      totalAmount: payload.totalAmount,
      currency: payload.currency,
      totalWeightKg: payload.totalWeightKg,
      lengthCm: payload.lengthCm,
      widthCm: payload.widthCm,
      heightCm: payload.heightCm,
      receiverName: payload.receiverName,
      receiverPhone: payload.receiverPhone,
      receiverAddress: payload.receiverAddress,
      receiverCity: payload.receiverCity,
      receiverState: payload.receiverState,
      receiverPincode: payload.receiverPincode,
      receiverCountry: payload.receiverCountry,
      status: ShipmentStatusEnum.DRAFT,
      retryCount: 0,
      createdBy: payload.createdBy,
      modifiedBy: payload.createdBy,
      createdIp: payload.createdIp,
      modifiedIp: payload.createdIp,
    } as TxnShipment);

    if (payload.items.length > 0) {
      await this.shipmentItemRepository.bulkCreate(
        payload.items.map((item) => ({
          shipmentId: shipment.shipmentId,
          memberProductOrderItemId: item.memberProductOrderItemId,
          quantity: item.quantity,
        })),
      );
    }

    this.logger.log(
      `Created shipment ${shipment.shipmentNumber} (id=${shipment.shipmentId}) for order ${payload.orderId}`,
    );
    return shipment;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  public async findAll(searchDto: BasicSearchDto): Promise<ITableList<IShipment>> {
    const whereCondition = SearchUtil.filterBasicSearch(searchDto, 'shipmentNumber');
    const pageNumber = searchDto.page ?? 0;
    const pageSize = searchDto.limit ?? 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.shipmentRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['shipmentId', 'DESC']],
      offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    return {
      tableData: rows.map((row: TxnShipment) => this.toShipmentModel(row)),
      count,
    };
  }

  public async getById(shipmentId: number): Promise<IShipment> {
    const shipment = await this.shipmentRepository.scope('details').findOne({
      where: { shipmentId },
      raw: false,
      nest: true,
    });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);
    return this.toShipmentModel(shipment);
  }

  public async getEntityById(shipmentId: number): Promise<TxnShipment> {
    const shipment = await this.shipmentRepository.scope('details').findOne({
      where: { shipmentId },
      raw: false,
      nest: true,
    });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);
    return shipment.toJSON();
  }

  /**
   * Returns the latest shipment for an order. Used by the rebook guard and by
   * any caller that wants "the current shipment" — after a cancel + rebook
   * there can be multiple rows for the same orderId, so we always need the
   * most recent one.
   */
  public async getByOrderId(orderId: number): Promise<TxnShipment | null> {
    return this.shipmentRepository.findOne({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
  }

  /** How many shipment rows exist for an order (used to suffix rebook numbers). */
  public async countByOrderId(orderId: number): Promise<number> {
    return this.shipmentRepository.count({ where: { orderId } });
  }

  public async getRateQuotes(shipmentId: number): Promise<TxnShipmentRateQuote[]> {
    return this.rateQuoteRepository.findAll({
      where: { shipmentId },
      order: [
        ['isSelected', 'DESC'],
        ['rateAmount', 'ASC'],
      ],
    });
  }

  public async getSelectedRateQuote(shipmentId: number): Promise<TxnShipmentRateQuote | null> {
    return this.rateQuoteRepository.findOne({ where: { shipmentId, isSelected: true } });
  }

  /**
   * Returns shipments eligible for cron retry:
   *   status IN (FAILED, BOOKING_REQUESTED)
   *   AND retry_count < MAX_RETRIES
   *   AND next_retry_at <= NOW()
   *   AND (retry_claimed_at IS NULL OR retry_claimed_at < NOW() - claimTtl)
   */
  public async getRetryableShipments(limit = 20): Promise<TxnShipment[]> {
    return this.shipmentRepository.findAll({
      where: {
        status: { [Op.in]: [ShipmentStatusEnum.BOOKING_REQUESTED, ShipmentStatusEnum.FAILED] },
        retryCount: { [Op.lt]: SHIPMENT_CONFIG.MAX_RETRIES },
        nextRetryAt: { [Op.lte]: new Date() },
        [Op.or]: [
          { retryClaimedAt: null as unknown as Date },
          { retryClaimedAt: { [Op.lt]: this.claimStaleCutoff() } },
        ],
      },
      order: [
        ['nextRetryAt', 'ASC'],
        ['shipmentId', 'ASC'],
      ],
      limit,
    });
  }

  /**
   * Returns non-terminal shipments that should be re-polled against the
   * carrier — webhook fallback for cases where the carrier's webhook was
   * missed (system was down) or where the cancel/status flip is async on the
   * carrier side (Shiprocket explicitly queues cancellations).
   *
   * Ordered oldest-`updatedAt` first so the cron naturally rotates through
   * stale records instead of repeatedly hammering the same recent ones.
   */
  public async getStatusSyncCandidates(limit = 50): Promise<TxnShipment[]> {
    return this.shipmentRepository.findAll({
      where: {
        status: {
          [Op.in]: [
            ShipmentStatusEnum.BOOKED,
            ShipmentStatusEnum.PICKUP_SCHEDULED,
            ShipmentStatusEnum.IN_TRANSIT,
            ShipmentStatusEnum.OUT_FOR_DELIVERY,
          ],
        },
        trackingNumber: { [Op.ne]: null },
        courierProviderId: { [Op.ne]: null },
        [Op.or]: [
          { retryClaimedAt: null as unknown as Date },
          { retryClaimedAt: { [Op.lt]: this.claimStaleCutoff() } },
        ],
      },
      order: [['updatedAt', 'ASC']],
      limit,
    });
  }

  /**
   * Cooperative claim for cron processing. Uses a conditional UPDATE — under
   * PostgreSQL READ COMMITTED, the first worker to UPDATE locks the row, and
   * a concurrent worker's UPDATE rechecks the WHERE post-lock so it sees the
   * already-claimed row and matches zero rows.
   *
   * Returns true if this caller now owns the row; false if another worker
   * claimed it first. Stale claims (older than ttlMinutes) are recoverable so
   * a crashed worker doesn't permanently freeze a shipment.
   */
  public async tryClaim(shipmentId: number, ttlMinutes = 10): Promise<boolean> {
    const staleCutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const [affected] = await this.shipmentRepository.update(
      { retryClaimedAt: new Date() },
      {
        where: {
          shipmentId,
          [Op.or]: [
            { retryClaimedAt: null as unknown as Date },
            { retryClaimedAt: { [Op.lt]: staleCutoff } },
          ],
        },
      },
    );
    return affected > 0;
  }

  /** Releases a claim taken by tryClaim. Safe to call even if not held. */
  public async releaseClaim(shipmentId: number): Promise<void> {
    await this.shipmentRepository.update(
      { retryClaimedAt: null as unknown as Date },
      { where: { shipmentId } },
    );
  }

  private claimStaleCutoff(ttlMinutes = 10): Date {
    return new Date(Date.now() - ttlMinutes * 60 * 1000);
  }

  // ── Status transitions ────────────────────────────────────────────────────

  public async replaceRateQuotes(
    shipmentId: number,
    providerAccountId: number,
    courierProviderId: number,
    warehouseId: number,
    quotes: IRateQuote[],
  ): Promise<TxnShipmentRateQuote[]> {
    // Wrap delete + bulkCreate + status flip in one transaction so a concurrent
    // run for the same shipment can't see a half-replaced quote set.
    const transaction = await this.sequelize.transaction();
    try {
      await this.rateQuoteRepository.destroy({
        where: { shipmentId, providerAccountId, isSelected: false },
        transaction,
      });

      if (quotes.length > 0) {
        await this.rateQuoteRepository.bulkCreate(
          quotes.map((q) => ({
            shipmentId,
            warehouseId: warehouseId,
            courierProviderId: courierProviderId,
            providerAccountId,
            serviceName: q.serviceName,
            estimatedDays: q.estimatedDays ?? null,
            rateAmount: q.rateAmount,
            currency: q.currency,
            isSelected: false,
            rawResponse: q.metadata ?? null,
          })),
          { transaction },
        );
      }

      await this.shipmentRepository.update(
        { status: ShipmentStatusEnum.RATE_REQUESTED, lastKnownStatus: ShipmentStatusEnum.RATE_REQUESTED },
        { where: { shipmentId }, transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    return this.getRateQuotes(shipmentId);
  }

  public async selectRateQuote(
    shipmentId: number,
    rateQuoteId: number,
  ): Promise<TxnShipmentRateQuote> {
    const quote = await this.rateQuoteRepository.findOne({ where: { shipmentId, rateQuoteId } });
    if (!quote) {
      throw new NotFoundException(`Rate quote ${rateQuoteId} not found for shipment ${shipmentId}`);
    }

    // Three writes must agree on the same selected quote — race between two
    // selectRateQuote calls previously left isSelected set on two rows.
    const transaction = await this.sequelize.transaction();
    try {
      await this.rateQuoteRepository.update(
        { isSelected: false },
        { where: { shipmentId }, transaction },
      );
      await this.rateQuoteRepository.update(
        { isSelected: true },
        { where: { shipmentId, rateQuoteId }, transaction },
      );
      await this.shipmentRepository.update(
        {
          courierProviderId: quote.courierProviderId,
          providerAccountId: quote.providerAccountId,
          rateAmount: quote.rateAmount,
          currency: quote.currency,
          status: ShipmentStatusEnum.RATE_SELECTED,
          lastKnownStatus: ShipmentStatusEnum.RATE_SELECTED,
        },
        { where: { shipmentId }, transaction },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    return quote;
  }

  public async markWarehouseResolved(shipmentId: number, warehouseId: number): Promise<void> {
    await this.shipmentRepository.update({ warehouseId }, { where: { shipmentId } });
  }

  public async markBookingRequested(shipmentId: number): Promise<void> {
    await this.updateShipmentStatus(shipmentId, ShipmentStatusEnum.BOOKING_REQUESTED);
  }

  public async markBooked(
    shipmentId: number,
    booking: BookingResponseDto,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const previous = await this.shipmentRepository.findByPk(shipmentId, { raw: true });
    await this.shipmentRepository.update(
      {
        providerShipmentId: booking.providerShipmentId ?? null,
        trackingNumber: booking.trackingNumber ?? null,
        trackingUrl: booking.trackingUrl ?? null,
        status: ShipmentStatusEnum.BOOKED,
        lastKnownStatus: ShipmentStatusEnum.BOOKED,
        nextRetryAt: null,
        lastError: null,
        metaData: {
          ...metadata,
          bookingResponse: booking.metadata ?? null,
          labelUrl: booking.labelUrl ?? null,
          awbNumber: booking.awbNumber ?? null,
        },
      },
      { where: { shipmentId } },
    );
    this.logger.log(`Shipment ${shipmentId} BOOKED — AWB: ${booking.trackingNumber ?? 'N/A'}`);

    if (previous) {
      this.emitStatusChanged({
        shipmentId,
        orderId: previous.orderId,
        previousStatus: previous.status ?? null,
        newStatus: ShipmentStatusEnum.BOOKED,
        awbNumber: booking.awbNumber ?? booking.trackingNumber ?? null,
        trackingNumber: booking.trackingNumber ?? null,
        trackingUrl: booking.trackingUrl ?? null,
        source: 'BOOKING',
      });
    }
  }

  public async markFailed(
    shipmentId: number,
    errorMessage: string,
    retryCount: number,
    nextRetryAt: Date | null,
  ): Promise<void> {
    await this.shipmentRepository.update(
      {
        status: ShipmentStatusEnum.FAILED,
        lastKnownStatus: ShipmentStatusEnum.FAILED,
        retryCount,
        lastError: errorMessage,
        nextRetryAt,
      },
      { where: { shipmentId } },
    );
    this.logger.warn(`Shipment ${shipmentId} FAILED (attempt ${retryCount}): ${errorMessage}`);
  }

  /**
   * Marks a shipment CANCELLED and appends a manual tracking event.
   * Called by ShipmentOrchestrationService.cancelShipment() after the
   * carrier-side cancel succeeds.
   */
  public async markCancelled(
    shipmentId: number,
    adminId: number,
    adminIp: string,
    reason = 'Cancelled by admin',
  ): Promise<void> {
    const previous = await this.shipmentRepository.findByPk(shipmentId, { raw: true });

    await this.shipmentRepository.update(
      {
        status: ShipmentStatusEnum.CANCELLED,
        lastKnownStatus: ShipmentStatusEnum.CANCELLED,
        nextRetryAt: null,
        modifiedBy: adminId,
        modifiedIp: adminIp,
      },
      { where: { shipmentId } },
    );

    await this.trackingRepository.create(
      {
        shipmentId,
        providerStatus: ShipmentStatusEnum.CANCELLED,
        internalStatus: ShipmentStatusEnum.CANCELLED,
        description: reason,
        eventTime: new Date(),
        location: null,
        source: ShipmentTrackingSourceEnum.MANUAL,
        rawPayload: null,
      } as unknown as TxnShipmentTrackingEvent,
      { ignoreDuplicates: true },
    );

    this.logger.log(`Shipment ${shipmentId} CANCELLED by admin ${adminId}: ${reason}`);

    if (previous) {
      this.emitStatusChanged({
        shipmentId,
        orderId: previous.orderId,
        previousStatus: previous.status ?? null,
        newStatus: ShipmentStatusEnum.CANCELLED,
        awbNumber: previous.trackingNumber ?? null,
        trackingNumber: previous.trackingNumber ?? null,
        trackingUrl: previous.trackingUrl ?? null,
        source: 'MANUAL',
      });
    }
  }

  // ── Tracking ──────────────────────────────────────────────────────────────

  public async saveTrackingEvents(
    shipmentId: number,
    events: ITrackingEvent[],
    source: 'WEBHOOK' | 'POLLING' | 'MANUAL' = 'POLLING',
  ): Promise<void> {
    if (events.length === 0) return;

    // History rows are always recorded (composite unique guards duplicates).
    // The status flip below is gated by an event-time high-water mark so an
    // out-of-order webhook (e.g. a stale IN_TRANSIT after DELIVERED) cannot
    // regress the local status.
    await this.trackingRepository.bulkCreate(
      events.map((event) => ({
        shipmentId,
        providerStatus: event.status,
        internalStatus: this.mapProviderStatus(event.status),
        description: event.description ?? null,
        eventTime: event.eventTime,
        location: event.location ?? null,
        source,
        rawPayload: event.metadata ?? null,
      })),
      { ignoreDuplicates: true },
    );

    const latest = [...events].sort((a, b) => b.eventTime.getTime() - a.eventTime.getTime())[0];
    const mappedStatus = this.mapProviderStatus(latest.status);
    const previous = await this.shipmentRepository.findByPk(shipmentId, { raw: true });
    if (!previous) return;

    const newEventTime = new Date(latest.eventTime);
    const watermark = previous.lastStatusEventAt ? new Date(previous.lastStatusEventAt) : null;
    const isNewer = !watermark || newEventTime.getTime() > watermark.getTime();

    if (!isNewer) {
      this.logger.warn(
        `[Shipment:${shipmentId}] Out-of-order event ignored for status flip — ` +
          `eventTime=${newEventTime.toISOString()} <= watermark=${watermark?.toISOString()}; ` +
          `current status=${previous.status} (source=${source})`,
      );
      return;
    }

    await this.shipmentRepository.update(
      {
        status: mappedStatus,
        lastKnownStatus: mappedStatus,
        lastStatusEventAt: newEventTime,
      },
      { where: { shipmentId } },
    );

    if (previous.status !== mappedStatus) {
      this.emitStatusChanged({
        shipmentId,
        orderId: previous.orderId,
        previousStatus: previous.status ?? null,
        newStatus: mappedStatus,
        awbNumber: previous.trackingNumber ?? null,
        trackingNumber: previous.trackingNumber ?? null,
        trackingUrl: previous.trackingUrl ?? null,
        source,
      });
    }
  }

  private emitStatusChanged(payload: IShipmentStatusChangedEvent): void {
    // Fire-and-forget — listeners must not block the persistence path.
    try {
      this.eventEmitter.emit('shipment.status.changed', payload);
    } catch (err) {
      this.logger.warn(
        `Failed to emit shipment.status.changed for ${payload.shipmentId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  public async getTrackingInfo(shipmentId: number): Promise<ITrackingInfo> {
    const shipment = await this.getEntityById(shipmentId);
    const events = await this.trackingRepository.findAll({
      where: { shipmentId },
      order: [['eventTime', 'DESC']],
      raw: true,
    });

    return {
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      currentStatus: shipment.status,
      providerName: shipment.courierProvider?.providerName,
      trackingEvents: events.map((e: TxnShipmentTrackingEvent) => ({
        status: e.internalStatus,
        trackingEventId: e.trackingEventId,
        providerStatus: e.providerStatus,
        internalStatus: e.internalStatus,
        description: e.description,
        eventTime: e.eventTime,
        location: e.location,
      })),
    };
  }

  // ── Retry helpers ─────────────────────────────────────────────────────────

  public computeNextRetryAt(retryCount: number): Date | null {
    if (retryCount > SHIPMENT_CONFIG.MAX_RETRIES) return null;
    const idx = Math.min(retryCount - 1, SHIPMENT_CONFIG.BACKOFF_MINUTES.length - 1);
    const minutes = SHIPMENT_CONFIG.BACKOFF_MINUTES[idx];
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async updateShipmentStatus(
    shipmentId: number,
    status: ShipmentStatusEnum,
  ): Promise<void> {
    await this.shipmentRepository.update(
      { status, lastKnownStatus: status },
      { where: { shipmentId } },
    );
  }

  private mapProviderStatus(providerStatus: string): ShipmentStatusEnum {
    // Carriers send free-text ("In Transit", "Out for Delivery", "RTO Initiated").
    // Normalize whitespace/hyphens to underscores so the substring checks match
    // regardless of separator style.
    const s = (providerStatus ?? '').toUpperCase().replace(/[\s-]+/g, '_');
    if (s.includes('DELIVERED')) return ShipmentStatusEnum.DELIVERED;
    if (s.includes('OUT_FOR_DELIVERY')) return ShipmentStatusEnum.OUT_FOR_DELIVERY;
    if (s.includes('CANCEL')) return ShipmentStatusEnum.CANCELLED;
    if (s.includes('RTO')) return ShipmentStatusEnum.RTO;
    if (s.includes('FAIL') || s.includes('LOST')) return ShipmentStatusEnum.FAILED;
    if (s.includes('IN_TRANSIT') || s.includes('TRANSIT') || s.includes('SHIPPED'))
      return ShipmentStatusEnum.IN_TRANSIT;
    if (s.includes('PICKUP')) return ShipmentStatusEnum.PICKUP_SCHEDULED;
    if (s.includes('BOOK')) return ShipmentStatusEnum.BOOKED;
    return ShipmentStatusEnum.IN_TRANSIT;
  }

  private toShipmentModel(shipment: TxnShipment): IShipment {
    const selectedQuote = shipment.rateQuotes?.find((q) => q.isSelected);
    const shipmentItems = Array.isArray(shipment.shipmentItems)
      ? shipment.shipmentItems.map((item) => ({
          shipmentItemId: item.shipmentItemId,
          shipmentId: item.shipmentId,
          memberProductOrderItemId: item.memberProductOrderItemId,
          quantity: item.quantity,
        }))
      : [];

    return {
      shipmentId: shipment.shipmentId,
      shipmentNumber: shipment.shipmentNumber,
      orderId: shipment.orderId,
      courierProviderId: shipment.courierProviderId,
      providerAccountId: shipment.providerAccountId,
      franchiseId: shipment.franchiseId,
      warehouseId: shipment.warehouseId,
      providerShipmentId: shipment.providerShipmentId ?? undefined,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      totalWeightKg:
        shipment.totalWeightKg != null
          ? CommonFunctionsUtil.toNumber(shipment.totalWeightKg)
          : undefined,
      lengthCm:
        shipment.lengthCm != null ? CommonFunctionsUtil.toNumber(shipment.lengthCm) : undefined,
      widthCm:
        shipment.widthCm != null ? CommonFunctionsUtil.toNumber(shipment.widthCm) : undefined,
      heightCm:
        shipment.heightCm != null ? CommonFunctionsUtil.toNumber(shipment.heightCm) : undefined,
      receiverName: shipment.receiverName ?? undefined,
      receiverPhone: shipment.receiverPhone ?? undefined,
      receiverAddress: shipment.receiverAddress ?? undefined,
      receiverCity: shipment.receiverCity ?? undefined,
      receiverState: shipment.receiverState ?? undefined,
      receiverPincode: shipment.receiverPincode ?? undefined,
      receiverCountry: shipment.receiverCountry ?? undefined,
      totalAmount:
        shipment.totalAmount != null
          ? CommonFunctionsUtil.toNumber(shipment.totalAmount)
          : undefined,
      rateAmount:
        shipment.rateAmount != null
          ? CommonFunctionsUtil.toNumber(shipment.rateAmount)
          : selectedQuote?.rateAmount,
      currency: shipment.currency ?? selectedQuote?.currency ?? undefined,
      status: shipment.status,
      providerName: shipment.courierProvider?.providerName,
      serviceName: selectedQuote?.serviceName,
      metaData: shipment.metaData as IShipment['metaData'],
      lastError: shipment.lastError ?? undefined,
      retryCount: shipment.retryCount,
      nextRetryAt: shipment.nextRetryAt ?? undefined,
      shipmentItems,
      createdBy: shipment.createdBy ?? 0,
      modifiedBy: shipment.modifiedBy ?? 0,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      trackingEvents: Array.isArray(shipment.trackingEvents)
        ? shipment.trackingEvents.map((event) => ({
            shipmentTrackingEventId: event.trackingEventId,
            shipmentId: event.shipmentId,
            status: this.mapTrackingStatus(event.internalStatus),
            description: event.description,
            eventTime: event.eventTime,
            source: event.source as ShipmentTrackingSourceEnum,
            createdAt: event.createdAt,
          }))
        : [],
    };
  }

  private mapTrackingStatus(status: string): ShipmentTrackingEnum {
    const s = status?.toUpperCase() ?? '';
    if (s.includes('DELIVERED')) return ShipmentTrackingEnum.DELIVERED;
    if (s.includes('OUT_FOR_DELIVERY')) return ShipmentTrackingEnum.OUT_FOR_DELIVERY;
    if (s.includes('IN_TRANSIT')) return ShipmentTrackingEnum.IN_TRANSIT;
    if (s.includes('FAILED')) return ShipmentTrackingEnum.FAILED;
    if (s.includes('RTO') || s.includes('RETURN')) return ShipmentTrackingEnum.RETURNED;
    if (s.includes('BOOK') || s.includes('PICKUP')) return ShipmentTrackingEnum.SHIPPED;
    return ShipmentTrackingEnum.CREATED;
  }
}
