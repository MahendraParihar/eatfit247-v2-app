import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction, Op } from 'sequelize';
import { TxnShipment, TxnShipmentItem } from '../models';
import { TxnMemberProduct, TxnMemberProductOrderItem } from '@server_1/modules/member/src/models';
import { IBasicSearch, ITableList } from '@eatfit247-shared-lib';
import { SearchUtil } from '@server_1/core';
import { ShipmentRepository } from '../repositories/shipment.repository';
import { ShipmentItemRepository } from '../repositories/shipment-item.repository';

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentModel: typeof TxnShipment,
    @InjectModel(TxnShipmentItem)
    private readonly shipmentItemModel: typeof TxnShipmentItem,
    @InjectModel(TxnMemberProduct)
    private readonly memberProductModel: typeof TxnMemberProduct,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly shipmentRepository: ShipmentRepository,
    private readonly shipmentItemRepository: ShipmentItemRepository,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<any>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'shipmentNumber');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.shipmentModel.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    return {
      tableData: rows,
      count: count,
    };
  }

  public async findById(id: number): Promise<TxnShipment> {
    const shipment = await this.shipmentModel.scope('details').findByPk(id);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return shipment;
  }

  public async createDraft(
    memberProductId: number,
    createdBy: number,
    createdIp: string,
  ): Promise<TxnShipment> {
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      const memberProduct = await this.memberProductModel.findByPk(memberProductId, {
        include: [
          {
            model: TxnMemberProductOrderItem,
            as: 'orderItems',
            required: false,
          },
        ],
        transaction,
      });

      if (!memberProduct) {
        throw new NotFoundException(`Member product with ID ${memberProductId} not found`);
      }

      if (!memberProduct.active) {
        throw new BadRequestException(`Member product ${memberProductId} is not active`);
      }

      if (!memberProduct.franchiseId) {
        throw new BadRequestException(`Member product ${memberProductId} does not have a franchise`);
      }

      const orderItems = (memberProduct as any).orderItems || [];
      if (orderItems.length === 0) {
        throw new BadRequestException(`Member product ${memberProductId} has no order items`);
      }

      const totalShipped = await this.calculateTotalShippedQuantity(memberProductId, transaction);
      const totalOrdered = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

      if (totalShipped >= totalOrdered) {
        throw new BadRequestException(
          `Member product ${memberProductId} is fully shipped. Total ordered: ${totalOrdered}, Total shipped: ${totalShipped}`,
        );
      }

      const shipmentNumber = this.generateShipmentNumber(memberProduct.franchiseId);

      const shipment = await this.shipmentRepository.createDraft(
        memberProduct.franchiseId,
        shipmentNumber,
        createdBy,
        createdIp,
        transaction,
      );

      await transaction.commit();
      return this.findById(shipment.shipmentId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async addItems(
    shipmentId: number,
    items: Array<{ memberProductOrderItemId: number; quantity: number }>,
    modifiedBy: number,
    modifiedIp: string,
  ): Promise<TxnShipment> {
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      const shipment = await this.shipmentRepository.findById(shipmentId);
      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }

      if (shipment.status !== 'DRAFT') {
        throw new BadRequestException(
          `Cannot add items to shipment ${shipmentId}. Current status: ${shipment.status}. Expected: DRAFT`,
        );
      }

      for (const item of items) {
        const validation = await this.shipmentItemRepository.validateRemainingQuantity(
          item.memberProductOrderItemId,
          item.quantity,
        );

        if (!validation.isValid) {
          throw new BadRequestException(
            `Invalid quantity for order item ${item.memberProductOrderItemId}. ` +
              `Requested: ${item.quantity}, Remaining: ${validation.remainingQuantity}, Total: ${validation.totalQuantity}`,
          );
        }
      }

      await this.shipmentItemRepository.addItems(shipmentId, items, transaction);

      await this.recalculateTotals(shipmentId, transaction);

      await this.shipmentRepository.update(
        shipmentId,
        {
          modifiedBy,
          modifiedIp,
        },
        transaction,
      );

      await transaction.commit();
      return this.findById(shipmentId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async calculateTotalShippedQuantity(
    memberProductId: number,
    transaction?: Transaction,
  ): Promise<number> {
    const shipmentItems = await this.shipmentItemModel.findAll({
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
        {
          model: TxnMemberProductOrderItem,
          as: 'memberProductOrderItem',
          required: true,
          where: {
            memberProductId,
          },
          attributes: [],
        },
      ],
      transaction,
    });

    return shipmentItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  private async recalculateTotals(shipmentId: number, transaction?: Transaction): Promise<void> {
    const shipmentItems = await this.shipmentItemRepository.findByShipmentId(shipmentId);

    let totalWeightKg = 0;
    let totalAmount = 0;

    for (const item of shipmentItems) {
      const orderItem = (item as any).memberProductOrderItem;
      if (orderItem) {
        totalAmount += parseFloat((orderItem.totalAmount * item.quantity).toString());
      }
    }

    await this.shipmentRepository.updateTotals(
      shipmentId,
      {
        totalWeightKg: totalWeightKg || null,
        totalAmount: totalAmount || null,
      },
      transaction,
    );
  }

  private generateShipmentNumber(franchiseId: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SH-${franchiseId}-${timestamp}-${random}`;
  }

  public async create(
    data: any,
    requestedIp: string,
    createdBy: number,
  ): Promise<TxnShipment> {
    const shipment = await this.shipmentModel.create({
      ...data,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
      createdBy,
      modifiedBy: createdBy,
      status: 'DRAFT',
    });
    if (data.items && Array.isArray(data.items)) {
      await this.shipmentItemModel.bulkCreate(
        data.items.map((item: any) => ({
          ...item,
          shipmentId: shipment.shipmentId,
        })),
      );
    }
    return this.findById(shipment.shipmentId);
  }

  public async update(
    id: number,
    data: any,
    requestedIp: string,
    modifiedBy: number,
  ): Promise<TxnShipment> {
    const shipment = await this.findById(id);
    await shipment.update({
      ...data,
      modifiedIp: requestedIp,
      modifiedBy,
    });
    if (data.items && Array.isArray(data.items)) {
      await this.shipmentItemModel.destroy({
        where: { shipmentId: id },
      });
      await this.shipmentItemModel.bulkCreate(
        data.items.map((item: any) => ({
          ...item,
          shipmentId: id,
        })),
      );
    }
    return this.findById(id);
  }

  public async book(id: number): Promise<TxnShipment> {
    const shipment = await this.findById(id);
    // This will be implemented with the courier provider integration
    // For now, just update status
    await shipment.update({
      status: 'BOOKING_REQUESTED',
    });
    return this.findById(id);
  }
}

