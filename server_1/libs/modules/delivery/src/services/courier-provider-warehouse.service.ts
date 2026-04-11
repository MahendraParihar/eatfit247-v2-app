import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnCourierProviderWarehouse } from '../models';
import {
  IBasicSearch,
  ICourierProviderWarehouse,
  IManageCourierProviderWarehouse,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';

@Injectable()
export class CourierProviderWarehouseService {
  constructor(
    @InjectModel(TxnCourierProviderWarehouse)
    private readonly courierProviderWarehouseRepository: typeof TxnCourierProviderWarehouse,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICourierProviderWarehouse>> {
    const whereCondition: Record<string, unknown> = SearchUtil.filterBasicSearch(
      searchDto,
      'providerWarehouseName',
    );
    const pageNumber = searchDto.page ?? 0;
    const pageSize = searchDto.limit ?? 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.courierProviderWarehouseRepository
      .scope('list')
      .findAndCountAll({
        where: whereCondition,
        order: TableListSortUtil.orderFromAllowlist(
          searchDto,
          new Set([
            'courierProviderWarehouseId',
            'courierProviderId',
            'warehouseId',
            'providerWarehouseName',
            'active',
            'createdAt',
            'updatedAt',
          ]),
          [['courierProviderWarehouseId', 'DESC']],
        ),
        offset,
        limit: pageSize,
        raw: true,
        nest: true,
      });

    const resList: ICourierProviderWarehouse[] = rows.map((item: TxnCourierProviderWarehouse) =>
      this.convertToModel(item),
    );
    return { tableData: resList, count };
  }

  private convertToModel(item: TxnCourierProviderWarehouse): ICourierProviderWarehouse {
    return {
      courierProviderWarehouseId: item.courierProviderWarehouseId,
      warehouseId: item.warehouseId,
      courierProviderId: item.courierProviderId,
      providerWarehouseId: item.providerWarehouseId,
      providerWarehouseName: item.providerWarehouseName,
      rawResponse: item.rawResponse,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      warehouse: item.warehouse
        ? {
            warehouseId: item.warehouse.warehouseId,
            name: item.warehouse.name,
          }
        : undefined,
      provider: item.provider
        ? {
            courierProviderId: item.provider.courierProviderId,
            providerCode: item.provider.providerCode,
            providerName: item.provider.providerName,
          }
        : undefined,
    };
  }

  public async fetchById(id: number): Promise<ICourierProviderWarehouse> {
    const find = await this.courierProviderWarehouseRepository.scope('details').findOne({
      where: { courierProviderWarehouseId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Courier provider warehouse not found');
    }
    return this.convertToModel(find);
  }

  public async create(
    obj: IManageCourierProviderWarehouse,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const createObj = {
      warehouseId: obj.warehouseId,
      courierProviderId: obj.courierProviderId,
      providerWarehouseId: obj.providerWarehouseId ?? null,
      providerWarehouseName: obj.providerWarehouseName ?? null,
      rawResponse: obj.rawResponse ?? null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.courierProviderWarehouseRepository.create(
      createObj as unknown as Record<string, unknown>,
    );
  }

  public async update(
    id: number,
    obj: IManageCourierProviderWarehouse,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.courierProviderWarehouseRepository.findOne({
      where: { courierProviderWarehouseId: id },
    });
    if (!find) {
      throw new NotFoundException('Courier provider warehouse not found');
    }
    const updateObj = {
      warehouseId: obj.warehouseId,
      courierProviderId: obj.courierProviderId,
      providerWarehouseId: obj.providerWarehouseId ?? null,
      providerWarehouseName: obj.providerWarehouseName ?? null,
      rawResponse: obj.rawResponse ?? null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.courierProviderWarehouseRepository.update(
      updateObj as unknown as Record<string, unknown>,
      {
        where: { courierProviderWarehouseId: id },
      },
    );
  }

  public async delete(id: number): Promise<void> {
    const find = await this.courierProviderWarehouseRepository.findOne({
      where: { courierProviderWarehouseId: id },
    });
    if (!find) {
      throw new NotFoundException('Courier provider warehouse not found');
    }
    await this.courierProviderWarehouseRepository.destroy({
      where: { courierProviderWarehouseId: id },
    });
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.courierProviderWarehouseRepository.findOne({
      where: { courierProviderWarehouseId: id },
    });
    if (!find) {
      throw new NotFoundException('Courier provider warehouse not found');
    }
    await this.courierProviderWarehouseRepository.update(
      { active, modifiedBy: adminId, modifiedIp: cIp },
      { where: { courierProviderWarehouseId: id } },
    );
  }
}
