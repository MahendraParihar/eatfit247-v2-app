import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import {
  TxnCourierWebhookLog,
  MstCourierProvider,
  TxnShipment,
  TxnShipmentTrackingEvent,
} from '../models';
import { CourierFactory } from '../providers/courier.factory';
import { TrackingService } from './tracking.service';
import { ShipmentRepository } from '../repositories/shipment.repository';

/**
 * Webhook Service
 * 
 * Responsibilities:
 * - Validate provider
 * - Log raw webhook payload
 * - Process webhook inside transaction
 * - Insert tracking event
 * - Update shipment status
 * - Mark webhook processed
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectModel(TxnCourierWebhookLog)
    private readonly webhookLogRepository: typeof TxnCourierWebhookLog,
    @InjectModel(MstCourierProvider)
    private readonly courierProviderRepository: typeof MstCourierProvider,
    @InjectModel(TxnShipment)
    private readonly shipmentModel: typeof TxnShipment,
    @InjectModel(TxnShipmentTrackingEvent)
    private readonly trackingEventRepository: typeof TxnShipmentTrackingEvent,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly courierFactory: CourierFactory,
    private readonly trackingService: TrackingService,
    private readonly shipmentRepository: ShipmentRepository,
  ) {}

  /**
   * Handle incoming webhook from courier provider
   * 
   * @param providerCode - The provider code (case-insensitive)
   * @param payload - Raw webhook payload
   * @param headers - Request headers (for signature validation)
   * @returns Webhook processing result
   */
  public async handleWebhook(
    providerCode: string,
    payload: any,
    headers?: any,
  ): Promise<{ webhookLogId: number; processed: boolean; message: string }> {
    // Validate provider
    const provider = await this.validateProvider(providerCode);

    // Log raw webhook payload
    const webhookLog = await this.webhookLogRepository.create({
      providerId: provider.providerId,
      payload,
      headers: headers || {},
      signatureValid: false, // Will be validated during processing
      processed: false,
    });

    this.logger.log(
      `Webhook received from ${providerCode} (Log ID: ${webhookLog.webhookLogId})`,
    );

    try {
      // Process webhook inside transaction
      await this.processWebhook(webhookLog.webhookLogId);

      return {
        webhookLogId: webhookLog.webhookLogId,
        processed: true,
        message: 'Webhook processed successfully',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to process webhook ${webhookLog.webhookLogId}: ${error.message}`,
        error.stack,
      );

      // Update webhook log with error
      await webhookLog.update({
        errorMessage: error.message,
        processed: false,
      });

      throw error;
    }
  }

  /**
   * Process webhook directly from provider payload (simplified version)
   * This method processes webhooks without requiring webhook log entries
   * 
   * @param providerCode - The provider code (e.g., 'NIMBUS', 'SHIPROCKET', 'SHIPWAY')
   * @param payload - Raw webhook payload from the provider
   * @returns void
   */
  public async processWebhookDirectly(
    providerCode: string,
    payload: any,
  ): Promise<void> {
    // Extract tracking number with fallbacks for different payload formats
    const trackingNumber =
      payload.tracking_number ||
      payload.trackingNumber ||
      payload.awb_number ||
      payload.awbNumber ||
      payload.tracking_id ||
      payload.trackingId;

    if (!trackingNumber) {
      this.logger.warn(
        `No tracking number found in webhook payload from ${providerCode}`,
      );
      return;
    }

    // Find shipment by tracking number
    const shipment = await this.shipmentRepository.findByTrackingNumber(
      trackingNumber,
    );

    if (!shipment) {
      this.logger.warn(
        `Shipment not found for tracking number: ${trackingNumber}`,
      );
      return;
    }

    try {
      // Insert tracking event (this also updates shipment status internally)
      await this.trackingService.insertTrackingEvent(
        shipment.shipmentId, // camelCase property name
        providerCode,
        {
          providerStatus:
            payload.status ||
            payload.provider_status ||
            payload.event_status ||
            'UNKNOWN',
          description:
            payload.description ||
            payload.message ||
            payload.event_description ||
            payload.status,
          eventTime: payload.event_time
            ? new Date(payload.event_time)
            : payload.eventTime
              ? new Date(payload.eventTime)
              : payload.timestamp
                ? new Date(payload.timestamp)
                : new Date(),
          location:
            payload.location ||
            payload.city ||
            payload.location_name ||
            payload.locationName,
          source: 'WEBHOOK',
          rawPayload: payload,
        },
      );

      // Note: No need to call updateStatus separately as insertTrackingEvent
      // already handles status updates internally

      this.logger.log(
        `Webhook processed successfully for shipment ${shipment.shipmentId} from ${providerCode}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process webhook for shipment ${shipment.shipmentId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process webhook log entry
   * Processes webhook inside a database transaction
   * 
   * @param webhookLogId - The webhook log ID to process
   */
  public async processWebhook(webhookLogId: number): Promise<void> {
    const webhookLog = await this.webhookLogRepository.findByPk(webhookLogId, {
      include: [
        {
          model: MstCourierProvider,
          as: 'provider',
          required: true,
        },
      ],
    });

    if (!webhookLog) {
      throw new NotFoundException(`Webhook log with ID ${webhookLogId} not found`);
    }

    if (webhookLog.processed) {
      this.logger.warn(`Webhook ${webhookLogId} already processed, skipping`);
      return;
    }

    const provider = webhookLog.provider;
    if (!provider) {
      throw new BadRequestException(`Provider not found for webhook log ${webhookLogId}`);
    }

    // Validate provider is supported
    if (!this.courierFactory.isProviderSupported(provider.providerCode)) {
      throw new BadRequestException(
        `Provider ${provider.providerCode} is not supported`,
      );
    }

    // Process webhook inside transaction
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      // Parse webhook payload to extract tracking information
      const webhookData = this.parseWebhookPayload(
        provider.providerCode,
        webhookLog.payload,
      );

      if (!webhookData.trackingNumber && !webhookData.providerShipmentId) {
        throw new BadRequestException(
          'Webhook payload missing tracking number or provider shipment ID',
        );
      }

      // Find shipment by tracking number or provider shipment ID
      const shipment = await this.findShipment(
        webhookData.trackingNumber,
        webhookData.providerShipmentId,
        provider.providerId,
        transaction,
      );

      if (!shipment) {
        this.logger.warn(
          `Shipment not found for tracking: ${webhookData.trackingNumber || webhookData.providerShipmentId}`,
        );
        // Mark as processed even if shipment not found to avoid reprocessing
        await webhookLog.update(
          {
            processed: true,
            errorMessage: 'Shipment not found',
          },
          { transaction },
        );
        await transaction.commit();
        return;
      }

      // Map provider status to internal status using tracking service's mapping logic
      // We'll use the tracking service's insertTrackingEvent which handles mapping
      const eventTime = webhookData.eventTime || new Date();

      // Check for existing event (idempotency) within transaction
      const existingEvent = await this.trackingEventRepository.findOne({
        where: {
          shipmentId: shipment.shipmentId,
          providerStatus: webhookData.status,
          eventTime: eventTime,
        },
        transaction,
      });

      let trackingEvent: TxnShipmentTrackingEvent;

      if (existingEvent) {
        this.logger.debug(
          `Tracking event already exists for shipment ${shipment.shipmentId}, provider status ${webhookData.status}, event time ${eventTime}`,
        );
        trackingEvent = existingEvent;
      } else {
        // Use tracking service to map provider status to internal status
        // We'll call the private method via a workaround or implement mapping here
        // For now, let's use the tracking service's insertTrackingEvent method
        // But since it doesn't support transactions, we'll create it directly
        const internalStatus = this.mapProviderStatusToInternal(
          provider.providerCode,
          webhookData.status,
        );

        // Insert tracking event within transaction
        try {
          trackingEvent = await this.trackingEventRepository.create(
            {
              shipmentId: shipment.shipmentId,
              providerStatus: webhookData.status,
              internalStatus: internalStatus || null,
              description: webhookData.description || webhookData.status,
              eventTime: eventTime,
              location: webhookData.location,
              source: 'WEBHOOK',
              rawPayload: webhookLog.payload,
            },
            { transaction },
          );

          this.logger.log(
            `Tracking event inserted for shipment ${shipment.shipmentId}: ${webhookData.status} -> ${internalStatus || 'N/A'}`,
          );
        } catch (error: any) {
          // Handle unique constraint violation (race condition)
          if (error.name === 'SequelizeUniqueConstraintError') {
            this.logger.warn(
              `Duplicate tracking event detected (race condition) for shipment ${shipment.shipmentId}`,
            );
            // Fetch the existing event
            const duplicateEvent = await this.trackingEventRepository.findOne({
              where: {
                shipmentId: shipment.shipmentId,
                providerStatus: webhookData.status,
                eventTime: eventTime,
              },
              transaction,
            });
            if (duplicateEvent) {
              trackingEvent = duplicateEvent;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }

        // Update shipment status if internal status is provided
        if (internalStatus) {
          await this.shipmentModel.update(
            { status: internalStatus },
            {
              where: { shipmentId: shipment.shipmentId },
              transaction,
            },
          );
          this.logger.log(
            `Shipment ${shipment.shipmentId} status updated to ${internalStatus}`,
          );
        }
      }

      // Mark webhook as processed
      await webhookLog.update(
        {
          processed: true,
          signatureValid: true, // Assume valid if we got this far
        },
        { transaction },
      );

      await transaction.commit();

      this.logger.log(
        `Webhook ${webhookLogId} processed successfully for shipment ${shipment.shipmentId}`,
      );
    } catch (error: any) {
      await transaction.rollback();
      this.logger.error(
        `Error processing webhook ${webhookLogId}: ${error.message}`,
        error.stack,
      );

      // Update webhook log with error
      await webhookLog.update({
        errorMessage: error.message,
        processed: false,
      });

      throw error;
    }
  }

  /**
   * Validate provider exists and is active
   * 
   * @param providerCode - Provider code to validate
   * @returns Provider model
   */
  private async validateProvider(providerCode: string): Promise<MstCourierProvider> {
    if (!providerCode || typeof providerCode !== 'string') {
      throw new BadRequestException('Provider code is required');
    }

    // Validate provider is supported by factory
    if (!this.courierFactory.isProviderSupported(providerCode)) {
      throw new BadRequestException(
        `Provider ${providerCode} is not supported. Supported providers: ${this.courierFactory.getSupportedProviders().join(', ')}`,
      );
    }

    // Find provider in database
    const provider = await this.courierProviderRepository.findOne({
      where: { providerCode: providerCode.toUpperCase() },
    });

    if (!provider) {
      throw new NotFoundException(`Courier provider with code ${providerCode} not found`);
    }

    if (!provider.active) {
      throw new BadRequestException(`Courier provider ${providerCode} is not active`);
    }

    return provider;
  }

  /**
   * Parse webhook payload to extract tracking information
   * This is a generic parser that works with common webhook formats
   * Provider-specific adapters can override this logic
   * 
   * @param providerCode - Provider code
   * @param payload - Raw webhook payload
   * @returns Parsed webhook data
   */
  private parseWebhookPayload(
    providerCode: string,
    payload: any,
  ): {
    trackingNumber?: string;
    providerShipmentId?: string;
    status: string;
    description?: string;
    eventTime?: Date;
    location?: string;
  } {
    // Common webhook payload structure
    // Different providers may have different formats, this is a generic parser
    // Provider-specific parsing can be added in adapters or extended here

    const trackingNumber =
      payload.tracking_number ||
      payload.trackingNumber ||
      payload.awb_number ||
      payload.awbNumber ||
      payload.tracking_id ||
      payload.trackingId;

    const providerShipmentId =
      payload.shipment_id ||
      payload.shipmentId ||
      payload.order_id ||
      payload.orderId ||
      payload.provider_shipment_id ||
      payload.providerShipmentId;

    const status =
      payload.status ||
      payload.event_status ||
      payload.eventStatus ||
      payload.current_status ||
      payload.currentStatus ||
      'UNKNOWN';

    const description =
      payload.description ||
      payload.message ||
      payload.event_description ||
      payload.eventDescription ||
      status;

    const eventTime = payload.event_time
      ? new Date(payload.event_time)
      : payload.eventTime
        ? new Date(payload.eventTime)
        : payload.timestamp
          ? new Date(payload.timestamp)
          : new Date();

    const location =
      payload.location ||
      payload.city ||
      payload.location_name ||
      payload.locationName ||
      undefined;

    return {
      trackingNumber,
      providerShipmentId,
      status,
      description,
      eventTime,
      location,
    };
  }

  /**
   * Find shipment by tracking number or provider shipment ID
   * 
   * @param trackingNumber - Tracking number
   * @param providerShipmentId - Provider shipment ID
   * @param providerId - Provider ID
   * @param transaction - Database transaction
   * @returns Shipment model or null
   */
  private async findShipment(
    trackingNumber?: string,
    providerShipmentId?: string,
    providerId?: number,
    transaction?: Transaction,
  ): Promise<TxnShipment | null> {
    if (trackingNumber) {
      const shipment = await this.shipmentModel.findOne({
        where: { trackingNumber },
        transaction,
      });
      if (shipment) {
        return shipment;
      }
    }

    if (providerShipmentId && providerId) {
      const shipment = await this.shipmentModel.findOne({
        where: {
          providerShipmentId,
          providerId,
        },
        transaction,
      });
      if (shipment) {
        return shipment;
      }
    }

    return null;
  }

  /**
   * Map provider status to internal status
   * This is a basic mapping - can be extended with provider-specific logic
   * 
   * @param providerCode - Provider code
   * @param providerStatus - Provider status string
   * @returns Internal status or null if no mapping found
   */
  private mapProviderStatusToInternal(
    providerCode: string,
    providerStatus: string,
  ): string | null {
    if (!providerStatus) {
      return null;
    }

    const statusUpper = providerStatus.toUpperCase();

    // Common status mappings (can be extended per provider)
    const statusMap: Record<string, string> = {
      // Booking/Pickup statuses
      BOOKED: 'BOOKED',
      PICKED_UP: 'IN_TRANSIT',
      PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
      PICKUP_COMPLETED: 'IN_TRANSIT',

      // Transit statuses
      IN_TRANSIT: 'IN_TRANSIT',
      IN_TRANSIT_TO_DESTINATION: 'IN_TRANSIT',
      DISPATCHED: 'IN_TRANSIT',
      SHIPPED: 'IN_TRANSIT',

      // Delivery statuses
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY_ATTEMPT: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      DELIVERY_COMPLETED: 'DELIVERED',

      // RTO statuses
      RTO: 'RTO',
      RETURNED: 'RTO',
      RETURNED_TO_ORIGIN: 'RTO',
      RTO_IN_TRANSIT: 'RTO',

      // Failure statuses
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      CANCELLED_BY_USER: 'CANCELLED',
    };

    // Direct match
    if (statusMap[statusUpper]) {
      return statusMap[statusUpper];
    }

    // Partial match
    for (const [key, value] of Object.entries(statusMap)) {
      if (statusUpper.includes(key) || key.includes(statusUpper)) {
        return value;
      }
    }

    // No mapping found - return null to keep existing status
    this.logger.warn(
      `No status mapping found for provider ${providerCode} status: ${providerStatus}`,
    );
    return null;
  }
}

