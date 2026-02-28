import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import { TxnShipment, TxnShipmentItem } from '../models';
import {
  TxnMember,
  TxnMemberProduct,
  TxnMemberProductOrderItem,
} from '@server_1/modules/member/src/models';
import {
  IAddress,
  IBasicSearch,
  IShipment,
  IShipmentItem,
  IShipmentMetaData,
  IShipmentTrackingEvent,
  ITableList,
  TableEnum,
} from '@eatfit247-shared-lib';
import { SearchUtil } from '@server_1/core';
import { CreateShipmentDto, IShipmentItemInput, UpdateShipmentDto } from '../dto';
import { ShipmentItemRepository, ShipmentRepository } from '../repositories';
import { AddressService } from '@server_1/platform';

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
    private readonly addressService: AddressService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IShipment>> {
    const whereCondition = SearchUtil.filterBasicSearch(searchDto, 'shipmentNumber');
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
    const tableData: IShipment[] = rows.map((row) => this.convertToModel(row));

    return {
      tableData,
      count,
    };
  }

  public async findById(id: number): Promise<IShipment> {
    const shipment = await this.shipmentModel.scope('details').findByPk(id);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return this.convertToModel(shipment);
  }

  /**
   * Create draft shipment, optionally with items in one transaction.
   * When items are provided, enforces FULL QUANTITY rule per order item.
   *
   * @param memberProductId - Member product order ID
   * @param createdBy - Admin user ID
   * @param createdIp - Request IP
   * @param items - Optional items to add (full quantity per order item only)
   */
  public async createDraft(
    memberProductId: number,
    createdBy: number,
    createdIp: string,
    items?: IShipmentItemInput[],
  ): Promise<IShipment> {
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      const memberProduct: TxnMemberProduct = await this.memberProductModel.findByPk(
        memberProductId,
        {
          include: [
            {
              model: TxnMemberProductOrderItem,
              as: 'orderItems',
              required: false,
            },
            {
              model: TxnMember,
              required: true,
            },
          ],
          transaction,
        },
      );

      if (!memberProduct) {
        throw new NotFoundException(`Member product with ID ${memberProductId} not found`);
      }

      if (!memberProduct.active) {
        throw new BadRequestException(`Member product ${memberProductId} is not active`);
      }

      if (!memberProduct.franchiseId) {
        throw new BadRequestException(
          `Member product ${memberProductId} does not have a franchise`,
        );
      }

      const shippingAddress = await this.addressService.findByTableIdAndPk(
        TableEnum.MST_FRANCHISES,
        memberProduct.franchiseId,
      );

      const orderItems = memberProduct.orderItems || [];
      if (orderItems.length === 0) {
        throw new BadRequestException(`Member product ${memberProductId} has no order items`);
      }

      const shipmentNumber = this.generateShipmentNumber(memberProduct.franchiseId);
      const memberAddress: IAddress =
        memberProduct.memberAddress['billingAddress'] || memberProduct.memberAddress['address'];

      const shipmentMeta = <IShipmentMetaData>{
        codAmount: 0,
        delivery: {
          name: `${memberProduct.member.firstName} ${memberProduct.member.lastName}`,
          postcode: memberAddress.pinCode,
          address: memberAddress.postalAddress,
          city: memberAddress.cityVillage,
          state: memberAddress.state,
          phone: `${memberProduct.member.contactNumber}`,
        },
        pickup: {
          name: 'Mahendra Parihar', // TODO Replace
          postcode: shippingAddress.pinCode,
          address: shippingAddress.postalAddress,
          city: shippingAddress.cityVillage,
          state: shippingAddress.state,
          phone: '8097421877', // TODO Replace
        },
      };

      const shipment = await this.shipmentRepository.createDraft(
        memberProduct.franchiseId,
        shipmentNumber,
        shipmentMeta,
        createdBy,
        createdIp,
        transaction,
      );

      if (items && items.length > 0) {
        const seenIds = new Set<number>();
        for (const item of items) {
          if (seenIds.has(item.memberProductOrderItemId)) {
            throw new BadRequestException(
              `Duplicate order item ${item.memberProductOrderItemId} in request`,
            );
          }
          seenIds.add(item.memberProductOrderItemId);
        }

        for (const reqItem of items) {
          let remainingQuantity: number;
          let totalQuantity: number;
          try {
            const result = await this.shipmentItemRepository.validateRemainingQuantity(
              reqItem.memberProductOrderItemId,
              reqItem.quantity,
            );
            remainingQuantity = result.remainingQuantity;
            totalQuantity = result.totalQuantity;
          } catch (err) {
            if (err instanceof Error && err.message?.includes('not found')) {
              throw new NotFoundException(
                `Order item ${reqItem.memberProductOrderItemId} not found`,
              );
            }
            throw err;
          }

          if (remainingQuantity <= 0) {
            throw new BadRequestException(
              `Order item ${reqItem.memberProductOrderItemId} has no remaining quantity to ship (total: ${totalQuantity})`,
            );
          }
          if (reqItem.quantity !== remainingQuantity) {
            throw new BadRequestException(
              `Order item ${reqItem.memberProductOrderItemId} must be shipped in full quantity. ` +
                `Remaining: ${remainingQuantity}, requested: ${reqItem.quantity}. Partial quantity is not allowed.`,
            );
          }
        }

        await this.shipmentItemRepository.addItems(shipment.shipmentId, items, transaction);
      }

      await transaction.commit();
      return this.findById(shipment.shipmentId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private generateShipmentNumber(franchiseId: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SH-${franchiseId}-${timestamp}-${random}`;
  }

  public async create(
    data: CreateShipmentDto,
    requestedIp: string,
    createdBy: number,
  ): Promise<IShipment> {
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
        data.items.map((item: IShipmentItemInput) => ({
          ...item,
          shipmentId: shipment.shipmentId,
        })),
      );
    }
    return this.findById(shipment.shipmentId);
  }

  public async update(
    id: number,
    data: UpdateShipmentDto,
    requestedIp: string,
    modifiedBy: number,
  ): Promise<IShipment> {
    const shipment = await this.shipmentModel.findByPk(id);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
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
        data.items.map((item: IShipmentItemInput) => ({
          ...item,
          shipmentId: id,
        })),
      );
    }
    return this.findById(id);
  }

  public async book(id: number): Promise<TxnShipment> {
    const shipment = await this.shipmentModel.findByPk(id);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    // This will be implemented with the courier provider integration
    // For now, just update status
    await shipment.update({
      status: 'BOOKING_REQUESTED',
    });
    return this.shipmentModel.scope('details').findByPk(id);
  }

  /**
   * Add items to a DRAFT or FAILED shipment.
   * FAILED is allowed so admin can modify items and retry booking.
   * Enforces FULL QUANTITY rule: each selected order item must be shipped in its entire remaining quantity (no partial).
   *
   * @param shipmentId - Shipment ID
   * @param items - Array of { memberProductOrderItemId, quantity }
   * @param modifiedBy - Admin user ID
   * @param requestedIp - Request IP
   * @returns Updated shipment with items
   */
  public async addItems(
    shipmentId: number,
    items: IShipmentItemInput[],
    modifiedBy: number,
    requestedIp: string,
  ): Promise<IShipment> {
    const shipment = await this.shipmentModel.findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }
    const allowedStatuses = ['DRAFT', 'FAILED'];
    if (!allowedStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Shipment ${shipmentId} must be in DRAFT or FAILED status to add items. Current status: ${shipment.status}`,
      );
    }
    if (!items || items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const seenIds = new Set<number>();
    for (const item of items) {
      if (seenIds.has(item.memberProductOrderItemId)) {
        throw new BadRequestException(
          `Duplicate order item ${item.memberProductOrderItemId} in request`,
        );
      }
      seenIds.add(item.memberProductOrderItemId);
    }

    const transaction = await this.sequelize.transaction();
    try {
      await this.shipmentItemRepository.deleteByShipmentId(shipmentId, transaction);

      for (const reqItem of items) {
        let remainingQuantity: number;
        let totalQuantity: number;
        try {
          const result = await this.shipmentItemRepository.validateRemainingQuantity(
            reqItem.memberProductOrderItemId,
            reqItem.quantity,
          );
          remainingQuantity = result.remainingQuantity;
          totalQuantity = result.totalQuantity;
        } catch (err) {
          if (err instanceof Error && err.message?.includes('not found')) {
            throw new NotFoundException(`Order item ${reqItem.memberProductOrderItemId} not found`);
          }
          throw err;
        }

        if (remainingQuantity <= 0) {
          throw new BadRequestException(
            `Order item ${reqItem.memberProductOrderItemId} has no remaining quantity to ship (total: ${totalQuantity})`,
          );
        }
        if (reqItem.quantity !== remainingQuantity) {
          throw new BadRequestException(
            `Order item ${reqItem.memberProductOrderItemId} must be shipped in full quantity. ` +
              `Remaining: ${remainingQuantity}, requested: ${reqItem.quantity}. Partial quantity is not allowed.`,
          );
        }
      }

      await this.shipmentItemRepository.addItems(shipmentId, items, transaction);
      await shipment.update({ modifiedBy, modifiedIp: requestedIp }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return this.findById(shipmentId);
  }

  async fetchShipmentDetails(memberProductIds: number[]): Promise<IShipment[]> {
    const data = await this.shipmentModel.scope('details').findAll({
      include: [
        {
          model: TxnShipmentItem,
          required: false,
          where: {
            memberProductOrderItemId: memberProductIds,
          },
        },
      ],
    });
    return data.map((m: TxnShipment) => this.convertToModel(m));
  }

  /**
   * Convert TxnShipment model to IShipmentDetails response
   */
  private convertToModel(shipment: TxnShipment): IShipment {
    return {
      shipmentId: Number(shipment.shipmentId),
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      franchiseId: shipment.franchiseId,
      trackingNumber: shipment.trackingNumber || undefined,
      trackingUrl: shipment.trackingUrl || undefined,
      totalWeightKg: shipment.totalWeightKg,
      totalAmount: shipment.totalAmount,
      rateAmount: shipment.rateAmount,
      currency: shipment.currency,
      providerId: Number(shipment.providerId),
      providerName: shipment.provider?.providerName,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      createdBy: shipment.createdBy,
      modifiedBy: shipment.modifiedBy,
      serviceName:
        shipment.metaData && shipment.metaData['serviceName']
          ? shipment.metaData['serviceName']
          : undefined,
      providerAccountId: Number(shipment.providerAccountId),
      metaData: shipment.metaData,
      shipmentItems: shipment.shipmentItems
        ? shipment.shipmentItems.map(
            (ti) =>
              <IShipmentItem>{
                quantity: Number(ti.quantity),
                shipmentItemId: Number(ti.shipmentItemId),
                shipmentId: Number(ti.shipmentId),
                memberProductOrderItemId: Number(ti.memberProductOrderItemId),
              },
          )
        : [],
      trackingEvents: shipment.trackingEvents
        ? shipment.trackingEvents.map(
            (te) =>
              <IShipmentTrackingEvent>{
                shipmentId: Number(te.shipmentId),
                createdAt: te.createdAt,
                eventTime: te.eventTime,
                shipmentTrackingEventId: Number(te.trackingEventId),
                source: te.source,
                status: te.internalStatus,
              },
          )
        : [],
    };
  }
}
