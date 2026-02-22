import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnShipmentTrackingEvent } from '../models';

@Injectable()
export class TrackingRepository {
  constructor(
    @InjectModel(TxnShipmentTrackingEvent)
    private readonly trackingEventModel: typeof TxnShipmentTrackingEvent,
  ) {}

  async insertIfNotExists(
    shipmentId: number,
    eventData: {
      providerStatus: string;
      internalStatus: string;
      description?: string;
      eventTime: Date;
      location?: string;
      source: 'WEBHOOK' | 'POLLING' | 'MANUAL';
      rawPayload?: Record<string, any>;
    },
    transaction?: any,
  ): Promise<TxnShipmentTrackingEvent> {
    const existing = await this.trackingEventModel.findOne({
      where: {
        shipmentId,
        providerStatus: eventData.providerStatus,
        eventTime: eventData.eventTime,
      },
      transaction,
    });

    if (existing) {
      return existing;
    }

    try {
      const created = await this.trackingEventModel.create(
        {
          shipmentId,
          providerStatus: eventData.providerStatus,
          internalStatus: eventData.internalStatus,
          description: eventData.description,
          eventTime: eventData.eventTime,
          location: eventData.location,
          source: eventData.source,
          rawPayload: eventData.rawPayload,
        },
        { transaction },
      );
      return created;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const duplicate = await this.trackingEventModel.findOne({
          where: {
            shipmentId,
            providerStatus: eventData.providerStatus,
            eventTime: eventData.eventTime,
          },
          transaction,
        });
        if (duplicate) {
          return duplicate;
        }
      }
      throw error;
    }
  }

  async findByShipmentId(shipmentId: number): Promise<TxnShipmentTrackingEvent[]> {
    return this.trackingEventModel.findAll({
      where: { shipmentId },
      order: [['eventTime', 'DESC']],
    });
  }
}

