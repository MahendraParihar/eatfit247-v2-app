import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCourierProvider, TxnShipmentRateQuote } from '../models';
import { IRateQuote } from '@eatfit247-shared-lib';

@Injectable()
export class RateRepository {
  constructor(
    @InjectModel(TxnShipmentRateQuote) private readonly rateQuoteModel: typeof TxnShipmentRateQuote,
    @InjectModel(MstCourierProvider) private readonly courierProvider: typeof MstCourierProvider,
  ) {}

  async findByShipmentId(shipmentId: number): Promise<IRateQuote[]> {
    const data = await this.rateQuoteModel.findAll({
      include: [
        {
          attributes: ['providerName'],
          model: MstCourierProvider,
          required: true,
        },
      ],
      where: { shipmentId },
      order: [['rateAmount', 'ASC']],
    });
    return data.map((d: TxnShipmentRateQuote) => {
      const row = d.get({ plain: true });
      return {
        rateQuoteId: Number(row.rateQuoteId),
        shipmentId: Number(row.shipmentId),
        providerId: row.providerId,
        providerName: row.provider.providerName,
        providerAccountId: row.providerAccountId,
        serviceName: row.serviceName,
        rateAmount: Number(row.rateAmount),
        currency: row.currency,
        isSelected: row.isSelected,
        createdAt: row.createdAt,
        estimatedDays: row.estimatedDays,
        serviceCode: row.rawResponse['serviceCode'],
        estimatedDeliveryDate: row.rawResponse['estimatedDeliveryDate'],
      } as IRateQuote;
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
