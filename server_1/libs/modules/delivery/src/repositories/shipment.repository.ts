import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnShipment, MstCourierProvider, TxnCourierProviderAccount } from '../models';

@Injectable()
export class ShipmentRepository {
  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentModel: typeof TxnShipment,
    @InjectModel(MstCourierProvider)
    private readonly courierProviderModel: typeof MstCourierProvider,
  ) {}

  async findById(id: number): Promise<TxnShipment | null> {
    return this.shipmentModel.scope('details').findByPk(id);
  }

  async findByOrderId(orderId: number): Promise<TxnShipment[]> {
    return this.shipmentModel.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<TxnShipment | null> {
    return this.shipmentModel.findOne({
      where: { trackingNumber },
    });
  }

  async create(data: Partial<TxnShipment>): Promise<TxnShipment> {
    return this.shipmentModel.create(data as any);
  }

  async update(id: number, data: Partial<TxnShipment>): Promise<void> {
    await this.shipmentModel.update(data, {
      where: { shipmentId: id },
    });
  }

  /**
   * Update shipment after successful booking
   * Updates provider details, tracking information, and status
   */
  async updateAfterBooking(
    shipmentId: number,
    bookingData: {
      providerId?: number;
      providerAccountId?: number;
      providerShipmentId?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      status?: string;
      rateAmount?: number;
      currency?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    await this.shipmentModel.update(bookingData, {
      where: { shipmentId },
    });
  }

  /**
   * Mark shipment as failed with error message
   */
  async markFailed(shipmentId: number, errorMessage: string, retryCount?: number): Promise<void> {
    const updateData: Partial<TxnShipment> = {
      status: 'FAILED',
      lastError: errorMessage,
    };

    if (retryCount !== undefined) {
      updateData.retryCount = retryCount;
    } else {
      // Increment retry count if not provided
      const shipment = await this.findById(shipmentId);
      if (shipment) {
        updateData.retryCount = (shipment.retryCount || 0) + 1;
      }
    }

    await this.shipmentModel.update(updateData, {
      where: { shipmentId },
    });
  }

  /**
   * Get active courier providers ordered by priority
   * Returns providers with active accounts for the given franchise (if provided)
   */
  async getProvidersByPriority(franchiseId?: number): Promise<MstCourierProvider[]> {
    const whereClause: any = {
      active: true,
    };

    const queryOptions: any = {
      where: whereClause,
      order: [['priorityOrder', 'ASC']],
    };

    // If franchiseId is provided, only return providers that have active accounts for that franchise
    if (franchiseId) {
      queryOptions.include = [
        {
          model: TxnCourierProviderAccount,
          as: 'accounts',
          required: true,
          where: {
            franchiseId,
            active: true,
          },
          attributes: [],
        },
      ];
    }

    return this.courierProviderModel.findAll(queryOptions);
  }

  /**
   * Update shipment status
   */
  async updateStatus(shipmentId: number, status: string): Promise<void> {
    await this.shipmentModel.update(
      { status },
      {
        where: { shipmentId },
      },
    );
  }
}

