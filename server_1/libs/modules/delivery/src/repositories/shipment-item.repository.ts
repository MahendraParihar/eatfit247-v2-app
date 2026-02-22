import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize, Op } from 'sequelize';
import { TxnShipmentItem, TxnShipment } from '../models';
import { TxnMemberProductOrderItem } from '@server_1/modules/member/src/models';

@Injectable()
export class ShipmentItemRepository {
  constructor(
    @InjectModel(TxnShipmentItem)
    private readonly shipmentItemModel: typeof TxnShipmentItem,
    @InjectModel(TxnMemberProductOrderItem)
    private readonly memberProductOrderItemModel: typeof TxnMemberProductOrderItem,
  ) {}

  async addItems(
    shipmentId: number,
    items: Array<{ memberProductOrderItemId: number; quantity: number }>,
    transaction?: any,
  ): Promise<TxnShipmentItem[]> {
    const createdItems: TxnShipmentItem[] = [];

    for (const item of items) {
      const created = await this.shipmentItemModel.create(
        {
          shipmentId,
          memberProductOrderItemId: item.memberProductOrderItemId,
          quantity: item.quantity,
        },
        { transaction },
      );
      createdItems.push(created);
    }

    return createdItems;
  }

  async validateRemainingQuantity(
    memberProductOrderItemId: number,
    requestedQuantity: number,
  ): Promise<{ isValid: boolean; remainingQuantity: number; totalQuantity: number }> {
    const orderItem = await this.memberProductOrderItemModel.findByPk(memberProductOrderItemId);

    if (!orderItem) {
      throw new Error(`Order item ${memberProductOrderItemId} not found`);
    }

    const totalQuantity = orderItem.quantity;

    const shippedItems = await this.shipmentItemModel.findAll({
      where: {
        memberProductOrderItemId,
      },
      include: [
        {
          model: TxnShipment,
          as: 'shipment',
          required: true,
          where: {
            status: {
              [Op.notIn]: ['FAILED', 'CANCELLED'],
            },
          },
          attributes: [],
        },
      ],
    });

    const totalShipped = shippedItems.reduce((sum, item) => sum + item.quantity, 0);

    const remainingQuantity = totalQuantity - totalShipped;

    return {
      isValid: requestedQuantity <= remainingQuantity,
      remainingQuantity,
      totalQuantity,
    };
  }

  async findByShipmentId(shipmentId: number): Promise<TxnShipmentItem[]> {
    return this.shipmentItemModel.findAll({
      where: { shipmentId },
      include: [
        {
          model: TxnMemberProductOrderItem,
          as: 'memberProductOrderItem',
          required: false,
        },
      ],
    });
  }

  async deleteByShipmentId(shipmentId: number, transaction?: any): Promise<void> {
    await this.shipmentItemModel.destroy({
      where: { shipmentId },
      transaction,
    });
  }
}

