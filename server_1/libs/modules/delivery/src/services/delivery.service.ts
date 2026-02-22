import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import { TxnShipment } from '../models';
import { ShipmentRepository } from '../repositories/shipment.repository';
import { RateService } from './rate.service';
import { FailoverService } from './failover.service';

/**
 * Delivery Service (Orchestrator)
 *
 * Responsibilities:
 * - Validate shipment state
 * - Trigger rate calculation
 * - Trigger booking via FailoverService
 * - Prevent double booking
 * - Ensure idempotency
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentModel: typeof TxnShipment,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly shipmentRepository: ShipmentRepository,
    private readonly rateService: RateService,
    private readonly failoverService: FailoverService,
  ) {}

  /**
   * Request rates for a shipment
   * Validates shipment state and triggers rate calculation
   *
   * @param shipmentId - The shipment ID
   * @param idempotencyKey - Optional idempotency key to prevent duplicate requests
   * @returns Array of rate quotes
   */
  public async requestRates(shipmentId: number, idempotencyKey?: string): Promise<any> {
    // Validate shipment state
    await this.validateShipmentState(shipmentId, [
      'DRAFT',
      'RATE_REQUESTED', // Allow re-requesting rates
      'RATE_SELECTED', // Allow re-requesting if rate was selected but booking failed
    ]);

    // Check idempotency if key provided
    if (idempotencyKey) {
      await this.checkIdempotency(shipmentId, idempotencyKey, 'requestRates');
    }

    // Trigger rate calculation
    this.logger.log(`Requesting rates for shipment ${shipmentId}`);
    const rateQuotes = await this.rateService.requestRates(shipmentId);

    // Store idempotency key in metadata if provided
    if (idempotencyKey) {
      await this.storeIdempotencyKey(shipmentId, idempotencyKey, 'requestRates');
    }

    return rateQuotes;
  }

  /**
   * Create/Book a shipment (alias for bookShipment)
   * Validates shipment state, prevents double booking, and triggers booking via FailoverService
   *
   * @param shipmentId - The shipment ID
   * @param idempotencyKey - Optional idempotency key to prevent duplicate bookings
   * @returns Updated shipment
   */
  public async createShipment(shipmentId: number, idempotencyKey?: string): Promise<TxnShipment> {
    // Get shipment
    const shipment = await this.shipmentRepository.findById(shipmentId);

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // Validate shipment state - must have a selected rate
    if (shipment.status !== 'RATE_SELECTED') {
      throw new BadRequestException(
        `Shipment not ready for booking. Current status: ${shipment.status}. Expected: RATE_SELECTED`,
      );
    }

    // Verify rate is selected
    if (!shipment.rateAmount) {
      throw new BadRequestException(
        `Shipment ${shipmentId} must have a selected rate before booking`,
      );
    }

    // Prevent double booking
    const bookedStates = [
      'BOOKED',
      'PICKUP_SCHEDULED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];
    if (bookedStates.includes(shipment.status)) {
      throw new ConflictException(
        `Shipment ${shipmentId} is already booked. Current status: ${
          shipment.status
        }. Tracking number: ${shipment.trackingNumber || 'N/A'}`,
      );
    }

    if (shipment.trackingNumber) {
      throw new ConflictException(
        `Shipment ${shipmentId} already has a tracking number: ${shipment.trackingNumber}. Cannot book again.`,
      );
    }

    // Update status to BOOKING_REQUESTED
    await this.shipmentRepository.updateStatus(shipmentId, 'BOOKING_REQUESTED');

    // Store idempotency key in metadata if provided (before booking attempt)
    if (idempotencyKey) {
      await this.storeIdempotencyKey(shipmentId, idempotencyKey, 'createShipment');
    }

    // Trigger booking via FailoverService
    this.logger.log(`Initiating booking for shipment ${shipmentId}`);
    try {
      await this.failoverService.handleFailover(shipmentId);
    } catch (error: any) {
      this.logger.error(`Booking failed for shipment ${shipmentId}: ${error.message}`, error.stack);
      // FailoverService handles status updates, so we just rethrow
      throw error;
    }

    // Return updated shipment
    const updatedShipment = await this.shipmentRepository.findById(shipmentId);
    if (!updatedShipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found after booking`);
    }
    return updatedShipment;
  }

  /**
   * Book a shipment
   * Validates shipment state, prevents double booking, and triggers booking via FailoverService
   *
   * @param shipmentId - The shipment ID
   * @param idempotencyKey - Optional idempotency key to prevent duplicate bookings
   * @returns Updated shipment
   */
  public async bookShipment(shipmentId: number, idempotencyKey?: string): Promise<TxnShipment> {
    // Validate shipment state - must have a selected rate
    await this.validateShipmentState(shipmentId, [
      'RATE_SELECTED',
      'BOOKING_REQUESTED', // Allow retry if booking was requested but failed
    ]);

    // Prevent double booking - check if already booked
    await this.preventDoubleBooking(shipmentId);

    // Check idempotency if key provided
    if (idempotencyKey) {
      await this.checkIdempotency(shipmentId, idempotencyKey, 'bookShipment');
    }

    // Get shipment to verify rate is selected
    const shipment = await this.shipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // Verify rate is selected
    if (!shipment.rateAmount || shipment.status !== 'RATE_SELECTED') {
      throw new BadRequestException(
        `Shipment ${shipmentId} must have a selected rate before booking. Current status: ${shipment.status}`,
      );
    }

    // Update status to BOOKING_REQUESTED
    await this.shipmentRepository.updateStatus(shipmentId, 'BOOKING_REQUESTED');

    // Store idempotency key in metadata if provided (before booking attempt)
    if (idempotencyKey) {
      await this.storeIdempotencyKey(shipmentId, idempotencyKey, 'bookShipment');
    }

    // Trigger booking via FailoverService
    this.logger.log(`Initiating booking for shipment ${shipmentId}`);
    try {
      await this.failoverService.handleFailover(shipmentId);
    } catch (error: any) {
      this.logger.error(`Booking failed for shipment ${shipmentId}: ${error.message}`, error.stack);
      // FailoverService handles status updates, so we just rethrow
      throw error;
    }

    // Return updated shipment
    const updatedShipment = await this.shipmentRepository.findById(shipmentId);
    if (!updatedShipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found after booking`);
    }
    return updatedShipment;
  }

  /**
   * Validate shipment state
   * Ensures shipment is in one of the allowed states for the operation
   *
   * @param shipmentId - The shipment ID
   * @param allowedStates - Array of allowed status values
   * @throws BadRequestException if shipment is not in an allowed state
   */
  private async validateShipmentState(shipmentId: number, allowedStates: string[]): Promise<void> {
    const shipment = await this.shipmentRepository.findById(shipmentId);

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    if (!allowedStates.includes(shipment.status)) {
      throw new BadRequestException(
        `Shipment ${shipmentId} is in invalid state for this operation. ` +
          `Current status: ${shipment.status}. Allowed states: ${allowedStates.join(', ')}`,
      );
    }
  }

  /**
   * Prevent double booking
   * Checks if shipment is already booked
   *
   * @param shipmentId - The shipment ID
   * @throws ConflictException if shipment is already booked
   */
  private async preventDoubleBooking(shipmentId: number): Promise<void> {
    const shipment = await this.shipmentRepository.findById(shipmentId);

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // Check if already booked
    const bookedStates = [
      'BOOKED',
      'PICKUP_SCHEDULED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];
    if (bookedStates.includes(shipment.status)) {
      throw new ConflictException(
        `Shipment ${shipmentId} is already booked. Current status: ${
          shipment.status
        }. Tracking number: ${shipment.trackingNumber || 'N/A'}`,
      );
    }

    // Check if has tracking number (indicates booking was successful)
    if (shipment.trackingNumber) {
      throw new ConflictException(
        `Shipment ${shipmentId} already has a tracking number: ${shipment.trackingNumber}. Cannot book again.`,
      );
    }
  }

  /**
   * Check idempotency
   * Verifies if an operation with the same idempotency key was already performed
   *
   * @param shipmentId - The shipment ID
   * @param idempotencyKey - The idempotency key
   * @param operation - The operation name (e.g., 'requestRates', 'bookShipment')
   * @throws ConflictException if operation was already performed with this key
   */
  private async checkIdempotency(
    shipmentId: number,
    idempotencyKey: string,
    operation: string,
  ): Promise<void> {
    const shipment = await this.shipmentRepository.findById(shipmentId);

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const metadata = shipment.metadata || {};
    const idempotencyKeys = metadata['idempotencyKeys'] || {};

    // Check if this operation was already performed with this key
    if (idempotencyKeys[operation] === idempotencyKey) {
      this.logger.log(
        `Idempotency check: Operation ${operation} already performed for shipment ${shipmentId} with key ${idempotencyKey}`,
      );

      // For booking, check if it was successful
      if (operation === 'bookShipment' && shipment.status === 'BOOKED') {
        throw new ConflictException(
          `Shipment ${shipmentId} was already booked with idempotency key ${idempotencyKey}. ` +
            `Tracking number: ${shipment.trackingNumber || 'N/A'}`,
        );
      }

      // For rate requests, allow re-requesting but log it
      if (operation === 'requestRates') {
        this.logger.warn(
          `Duplicate rate request detected for shipment ${shipmentId} with idempotency key ${idempotencyKey}. Proceeding anyway.`,
        );
      }
    }
  }

  /**
   * Store idempotency key in shipment metadata
   *
   * @param shipmentId - The shipment ID
   * @param idempotencyKey - The idempotency key
   * @param operation - The operation name
   */
  private async storeIdempotencyKey(
    shipmentId: number,
    idempotencyKey: string,
    operation: string,
  ): Promise<void> {
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      const shipment = await this.shipmentModel.findByPk(shipmentId, { transaction });

      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }

      const metadata = shipment.metadata || {};
      const idempotencyKeys = metadata['idempotencyKeys'] || {};

      // Store the idempotency key for this operation
      idempotencyKeys[operation] = idempotencyKey;
      metadata['idempotencyKeys'] = idempotencyKeys;

      await this.shipmentModel.update(
        { metadata },
        {
          where: { shipmentId },
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      this.logger.error(
        `Failed to store idempotency key for shipment ${shipmentId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get shipment status
   * Helper method to get current shipment status
   *
   * @param shipmentId - The shipment ID
   * @returns Shipment with current status
   */
  public async getShipmentStatus(shipmentId: number): Promise<TxnShipment> {
    const shipment = await this.shipmentRepository.findById(shipmentId);

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    return shipment;
  }
}
