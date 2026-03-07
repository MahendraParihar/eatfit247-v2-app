import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
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
  ) {}

  // ── Creation ──────────────────────────────────────────────────────────────

  /**
   * Creates the initial DRAFT shipment + items from an order.
   * Called by ShipmentOrchestrationService.initiateFromOrder().
   */
  public async createForOrder(payload: ICreateShipmentPayload): Promise<TxnShipment> {
    const shipment = await this.shipmentRepository.create({
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
      raw: true,
      nest: true,
    });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);
    return this.toShipmentModel(shipment);
  }

  public async getEntityById(shipmentId: number): Promise<TxnShipment> {
    const shipment = await this.shipmentRepository.scope('details').findOne({
      where: { shipmentId },
    });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);
    return shipment;
  }

  /** Prevents duplicate shipments — called before creating */
  public async getByOrderId(orderId: number): Promise<TxnShipment | null> {
    return this.shipmentRepository.findOne({ where: { orderId } });
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
   */
  public async getRetryableShipments(limit = 20): Promise<TxnShipment[]> {
    return this.shipmentRepository.findAll({
      where: {
        status: { [Op.in]: [ShipmentStatusEnum.BOOKING_REQUESTED, ShipmentStatusEnum.FAILED] },
        retryCount: { [Op.lt]: SHIPMENT_CONFIG.MAX_RETRIES },
        nextRetryAt: { [Op.lte]: new Date() },
      },
      order: [
        ['nextRetryAt', 'ASC'],
        ['shipmentId', 'ASC'],
      ],
      limit,
    });
  }

  // ── Status transitions ────────────────────────────────────────────────────

  public async replaceRateQuotes(
    shipmentId: number,
    providerAccountId: number,
    quotes: IRateQuote[],
  ): Promise<TxnShipmentRateQuote[]> {
    await this.rateQuoteRepository.destroy({
      where: { shipmentId, providerAccountId, isSelected: false },
    });

    if (quotes.length > 0) {
      await this.rateQuoteRepository.bulkCreate(
        quotes.map((q) => ({
          shipmentId,
          providerId: q.providerId,
          providerAccountId,
          serviceName: q.serviceName,
          estimatedDays: q.estimatedDays ?? null,
          rateAmount: q.rateAmount,
          currency: q.currency,
          isSelected: false,
          rawResponse: q.metadata ?? null,
        })),
      );
    }

    await this.updateShipmentStatus(shipmentId, ShipmentStatusEnum.RATE_REQUESTED);
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

    await this.rateQuoteRepository.update({ isSelected: false }, { where: { shipmentId } });
    await this.rateQuoteRepository.update(
      { isSelected: true },
      { where: { shipmentId, rateQuoteId } },
    );

    await this.shipmentRepository.update(
      {
        providerId: quote.providerId,
        providerAccountId: quote.providerAccountId,
        rateAmount: quote.rateAmount,
        currency: quote.currency,
        status: ShipmentStatusEnum.RATE_SELECTED,
        lastKnownStatus: ShipmentStatusEnum.RATE_SELECTED,
      },
      { where: { shipmentId } },
    );
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

  // ── Tracking ──────────────────────────────────────────────────────────────

  public async saveTrackingEvents(
    shipmentId: number,
    events: ITrackingEvent[],
    source: 'WEBHOOK' | 'POLLING' | 'MANUAL' = 'POLLING',
  ): Promise<void> {
    if (events.length === 0) return;

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
    await this.shipmentRepository.update(
      { status: mappedStatus, lastKnownStatus: mappedStatus },
      { where: { shipmentId } },
    );
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
      providerName: shipment.provider?.providerName,
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
    const s = providerStatus?.toUpperCase() ?? '';
    if (s.includes('DELIVERED')) return ShipmentStatusEnum.DELIVERED;
    if (s.includes('OUT_FOR_DELIVERY')) return ShipmentStatusEnum.OUT_FOR_DELIVERY;
    if (s.includes('IN_TRANSIT')) return ShipmentStatusEnum.IN_TRANSIT;
    if (s.includes('PICKUP')) return ShipmentStatusEnum.PICKUP_SCHEDULED;
    if (s.includes('RTO')) return ShipmentStatusEnum.RTO;
    if (s.includes('CANCEL')) return ShipmentStatusEnum.CANCELLED;
    if (s.includes('FAIL')) return ShipmentStatusEnum.FAILED;
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
      providerId: shipment.providerId,
      providerAccountId: shipment.providerAccountId,
      franchiseId: shipment.franchiseId,
      warehouseId: shipment.warehouseId,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      totalWeightKg:
        shipment.totalWeightKg != null
          ? CommonFunctionsUtil.toNumber(shipment.totalWeightKg)
          : undefined,
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
      providerName: shipment.provider?.providerName,
      serviceName: selectedQuote?.serviceName,
      metaData: shipment.metaData,
      shipmentItems,
      createdBy: shipment.createdBy,
      modifiedBy: shipment.modifiedBy,
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
