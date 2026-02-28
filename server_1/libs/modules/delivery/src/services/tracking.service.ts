import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnShipment, TxnShipmentTrackingEvent } from '../models';
import { ShipmentRepository } from '../repositories/shipment.repository';

/**
 * Tracking Service
 * 
 * Responsibilities:
 * - Insert tracking event
 * - Enforce idempotency
 * - Map provider status → internal status
 * - Update shipment status
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentRepository: typeof TxnShipment,
    @InjectModel(TxnShipmentTrackingEvent)
    private readonly trackingEventRepository: typeof TxnShipmentTrackingEvent,
    private readonly shipmentRepo: ShipmentRepository,
  ) {}

  /**
   * Get tracking information for a shipment
   */
  public async getTracking(shipmentId: number): Promise<any> {
    const shipment = await this.shipmentRepository.findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const trackingEvents = await this.trackingEventRepository.findAll({
      where: { shipmentId },
      order: [['eventTime', 'DESC']],
    });

    return {
      shipment: {
        shipmentId: shipment.shipmentId,
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        status: shipment.status,
      },
      events: trackingEvents,
    };
  }

  /**
   * Insert tracking event with idempotency enforcement
   * 
   * This method:
   * 1. Checks for existing event (idempotency)
   * 2. Maps provider status to internal status
   * 3. Inserts tracking event
   * 4. Updates shipment status
   * 
   * @param shipmentId - The shipment ID
   * @param providerCode - The courier provider code (e.g., 'NIMBUS', 'SHIPROCKET', 'SHIPWAY')
   * @param eventData - The tracking event data from provider
   * @returns The created or existing tracking event
   */
  public async insertTrackingEvent(
    shipmentId: number,
    providerCode: string,
    eventData: {
      providerStatus: string;
      description?: string;
      eventTime: Date;
      location?: string;
      source: 'WEBHOOK' | 'POLLING' | 'MANUAL';
      rawPayload?: Record<string, unknown>;
    },
  ): Promise<TxnShipmentTrackingEvent> {
    // Validate shipment exists
    const shipment = await this.shipmentRepository.findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // Enforce idempotency: Check if event already exists
    // Unique constraint: (shipment_id, provider_status, event_time)
    const existingEvent = await this.trackingEventRepository.findOne({
      where: {
        shipmentId,
        providerStatus: eventData.providerStatus,
        eventTime: eventData.eventTime,
      },
    });

    if (existingEvent) {
      this.logger.debug(
        `Tracking event already exists for shipment ${shipmentId}, provider status ${eventData.providerStatus}, event time ${eventData.eventTime}`,
      );
      return existingEvent;
    }

    // Map provider status to internal status
    const internalStatus = this.mapProviderStatusToInternalStatus(
      providerCode,
      eventData.providerStatus,
    );

    // Insert tracking event
    let event: TxnShipmentTrackingEvent;
    try {
      event = await this.trackingEventRepository.create({
        shipmentId,
        providerStatus: eventData.providerStatus,
        internalStatus,
        description: eventData.description,
        eventTime: eventData.eventTime,
        location: eventData.location,
        source: eventData.source,
        rawPayload: eventData.rawPayload,
      });

      this.logger.log(
        `Tracking event inserted for shipment ${shipmentId}: ${eventData.providerStatus} -> ${internalStatus}`,
      );
    } catch (error: unknown) {
      const err = error as { name?: string };
      // Handle unique constraint violation (race condition)
      if (err?.name === 'SequelizeUniqueConstraintError') {
        this.logger.warn(
          `Duplicate tracking event detected (race condition) for shipment ${shipmentId}, provider status ${eventData.providerStatus}, event time ${eventData.eventTime}`,
        );
        // Fetch the existing event
        const duplicateEvent = await this.trackingEventRepository.findOne({
          where: {
            shipmentId,
            providerStatus: eventData.providerStatus,
            eventTime: eventData.eventTime,
          },
        });
        if (duplicateEvent) {
          return duplicateEvent;
        }
      }
      throw error;
    }

    // Update shipment status if internal status is mapped
    if (internalStatus) {
      await this.updateShipmentStatus(shipmentId, internalStatus);
    }

    return event;
  }

  /**
   * Map provider-specific status to internal status enum
   * 
   * @param providerCode - The courier provider code
   * @param providerStatus - The status from the provider
   * @returns The mapped internal status or null if no mapping exists
   */
  private mapProviderStatusToInternalStatus(
    providerCode: string,
    providerStatus: string,
  ): string | null {
    const normalizedProviderCode = providerCode.toUpperCase().trim();
    const normalizedStatus = providerStatus.toUpperCase().trim();

    // Common status mappings that work across providers
    const commonMappings: Record<string, string> = {
      // Delivered
      'DELIVERED': 'DELIVERED',
      'DELIVERY_COMPLETE': 'DELIVERED',
      'DELIVERED_SUCCESSFULLY': 'DELIVERED',
      'COMPLETED': 'DELIVERED',
      'SUCCESS': 'DELIVERED',

      // In Transit
      'IN_TRANSIT': 'IN_TRANSIT',
      'IN TRANSIT': 'IN_TRANSIT',
      'SHIPPED': 'IN_TRANSIT',
      'DISPATCHED': 'IN_TRANSIT',
      'PICKED_UP': 'IN_TRANSIT',
      'PICKED UP': 'IN_TRANSIT',

      // Out for Delivery
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'OUT FOR DELIVERY': 'OUT_FOR_DELIVERY',
      'ON_THE_WAY': 'OUT_FOR_DELIVERY',
      'ON THE WAY': 'OUT_FOR_DELIVERY',

      // Pickup Scheduled
      'PICKUP_SCHEDULED': 'PICKUP_SCHEDULED',
      'PICKUP SCHEDULED': 'PICKUP_SCHEDULED',
      'PICKUP_PENDING': 'PICKUP_SCHEDULED',
      'PICKUP PENDING': 'PICKUP_SCHEDULED',

      // Booked
      'BOOKED': 'BOOKED',
      'BOOKING_CONFIRMED': 'BOOKED',
      'BOOKING CONFIRMED': 'BOOKED',
      'ORDER_PLACED': 'BOOKED',
      'ORDER PLACED': 'BOOKED',

      // RTO (Return to Origin)
      'RTO': 'RTO',
      'RETURN_TO_ORIGIN': 'RTO',
      'RETURN TO ORIGIN': 'RTO',
      'RETURNED': 'RTO',
      'RETURN_INITIATED': 'RTO',
      'RETURN INITIATED': 'RTO',

      // Cancelled
      'CANCELLED': 'CANCELLED',
      'CANCELED': 'CANCELLED',
      'CANCELLATION': 'CANCELLED',
      'ORDER_CANCELLED': 'CANCELLED',
      'ORDER CANCELLED': 'CANCELLED',

      // Failed
      'FAILED': 'FAILED',
      'DELIVERY_FAILED': 'FAILED',
      'DELIVERY FAILED': 'FAILED',
      'EXCEPTION': 'FAILED',
      'UNDELIVERED': 'FAILED',
    };

    // Check common mappings first
    if (commonMappings[normalizedStatus]) {
      return commonMappings[normalizedStatus];
    }

    // Provider-specific mappings
    switch (normalizedProviderCode) {
      case 'NIMBUS':
        return this.mapNimbusStatus(normalizedStatus);
      case 'SHIPROCKET':
        return this.mapShiprocketStatus(normalizedStatus);
      case 'SHIPWAY':
        return this.mapShipwayStatus(normalizedStatus);
      default:
        this.logger.warn(
          `Unknown provider code: ${providerCode}, status: ${providerStatus} - no mapping applied`,
        );
        return null;
    }
  }

  /**
   * Map Nimbus-specific status codes
   */
  private mapNimbusStatus(status: string): string | null {
    const nimbusMappings: Record<string, string> = {
      'ORDER_PLACED': 'BOOKED',
      'PICKUP_SCHEDULED': 'PICKUP_SCHEDULED',
      'PICKED_UP': 'IN_TRANSIT',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'RTO_INITIATED': 'RTO',
      'RTO_DELIVERED': 'RTO',
      'CANCELLED': 'CANCELLED',
      'EXCEPTION': 'FAILED',
    };

    return nimbusMappings[status] || null;
  }

  /**
   * Map Shiprocket-specific status codes
   */
  private mapShiprocketStatus(status: string): string | null {
    const shiprocketMappings: Record<string, string> = {
      'NEW': 'BOOKED',
      'PICKUP_PENDING': 'PICKUP_SCHEDULED',
      'PICKUP_COMPLETED': 'IN_TRANSIT',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'RTO_INITIATED': 'RTO',
      'RTO_DELIVERED': 'RTO',
      'CANCELLED': 'CANCELLED',
      'LOST': 'FAILED',
      'DAMAGED': 'FAILED',
    };

    return shiprocketMappings[status] || null;
  }

  /**
   * Map Shipway-specific status codes
   */
  private mapShipwayStatus(status: string): string | null {
    const shipwayMappings: Record<string, string> = {
      'BOOKED': 'BOOKED',
      'PICKUP_SCHEDULED': 'PICKUP_SCHEDULED',
      'PICKED_UP': 'IN_TRANSIT',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'RTO': 'RTO',
      'RTO_DELIVERED': 'RTO',
      'CANCELLED': 'CANCELLED',
      'UNDELIVERED': 'FAILED',
    };

    return shipwayMappings[status] || null;
  }

  /**
   * Update shipment status
   * 
   * @param shipmentId - The shipment ID
   * @param status - The new status
   */
  private async updateShipmentStatus(shipmentId: number, status: string): Promise<void> {
    try {
      await this.shipmentRepo.updateStatus(shipmentId, status);
      this.logger.log(`Shipment ${shipmentId} status updated to ${status}`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to update shipment ${shipmentId} status to ${status}: ${err.message}`,
        err.stack,
      );
      // Don't throw - tracking event was inserted successfully
      // Status update failure should be logged but not fail the tracking event insertion
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use insertTrackingEvent instead
   */
  public async addTrackingEvent(
    shipmentId: number,
    eventData: {
      providerStatus: string;
      internalStatus?: string;
      description?: string;
      eventTime: Date;
      location?: string;
      source: 'WEBHOOK' | 'POLLING' | 'MANUAL';
      rawPayload?: Record<string, unknown>;
    },
  ): Promise<TxnShipmentTrackingEvent> {
    const shipment = await this.shipmentRepository.findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // Check idempotency
    const existingEvent = await this.trackingEventRepository.findOne({
      where: {
        shipmentId,
        providerStatus: eventData.providerStatus,
        eventTime: eventData.eventTime,
      },
    });

    if (existingEvent) {
      return existingEvent;
    }

    const event = await this.trackingEventRepository.create({
      shipmentId,
      ...eventData,
    });

    // Update shipment status if internal status is provided
    if (eventData.internalStatus) {
      await this.updateShipmentStatus(shipmentId, eventData.internalStatus);
    }

    return event;
  }

  public async pollTracking(shipmentId: number): Promise<void> {
    const shipment = await this.shipmentRepository.scope('details').findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // This will be implemented with the courier provider integration
    // For now, it's a placeholder
    // The actual implementation will:
    // 1. Get the courier provider adapter
    // 2. Call the tracking API
    // 3. Process and store tracking events
  }
}

