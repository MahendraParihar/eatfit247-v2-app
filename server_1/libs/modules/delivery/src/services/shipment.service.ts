import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnShipment, TxnShipmentItem } from '../models';
import { IBasicSearch, ITableList } from '@eatfit247-shared-lib';
import { SearchUtil } from '@server_1/core';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentRepository: typeof TxnShipment,
    @InjectModel(TxnShipmentItem)
    private readonly shipmentItemRepository: typeof TxnShipmentItem,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<any>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'shipmentNumber');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.shipmentRepository.scope('list').findAndCountAll({
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
    const shipment = await this.shipmentRepository.scope('details').findByPk(id);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return shipment;
  }

  public async create(
    data: any,
    requestedIp: string,
    createdBy: number,
  ): Promise<TxnShipment> {
    const shipment = await this.shipmentRepository.create({
      ...data,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
      createdBy,
      modifiedBy: createdBy,
      status: 'DRAFT',
    });

    if (data.items && Array.isArray(data.items)) {
      await this.shipmentItemRepository.bulkCreate(
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
      // Delete existing items and create new ones
      await this.shipmentItemRepository.destroy({
        where: { shipmentId: id },
      });

      await this.shipmentItemRepository.bulkCreate(
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

