import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnShipmentRateQuote } from '../models';

@Injectable()
export class RateRepository {
  constructor(
    @InjectModel(TxnShipmentRateQuote)
    private readonly rateQuoteModel: typeof TxnShipmentRateQuote,
  ) {}

  async findByShipmentId(shipmentId: number): Promise<TxnShipmentRateQuote[]> {
    return this.rateQuoteModel.findAll({
      where: { shipmentId },
      order: [['rateAmount', 'ASC']],
    });
  }

  async findSelectedByShipmentId(shipmentId: number): Promise<TxnShipmentRateQuote | null> {
    return this.rateQuoteModel.findOne({
      where: {
        shipmentId,
        isSelected: true,
      },
    });
  }

  async create(data: Partial<TxnShipmentRateQuote>): Promise<TxnShipmentRateQuote> {
    return this.rateQuoteModel.create(data as any);
  }

  async bulkCreate(data: Partial<TxnShipmentRateQuote>[]): Promise<TxnShipmentRateQuote[]> {
    return this.rateQuoteModel.bulkCreate(data as any[]);
  }

  async update(id: number, data: Partial<TxnShipmentRateQuote>): Promise<void> {
    await this.rateQuoteModel.update(data, {
      where: { rateQuoteId: id },
    });
  }
}

