import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstWarehouse } from '../models';
import {
  IBasicSearch,
  IDropdownItem,
  IManageWarehouse,
  ITableList,
  IWarehouse,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(MstWarehouse) private readonly warehouseRepository: typeof MstWarehouse,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IWarehouse>> {
    const whereCondition: Record<string, unknown> = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page ?? 0;
    const pageSize = searchDto.limit ?? 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.warehouseRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['name', 'ASC']],
      offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IWarehouse[] = rows.map((item: MstWarehouse) => this.convertToModel(item));
    return { tableData: resList, count };
  }

  private convertToModel(item: MstWarehouse): IWarehouse {
    return {
      warehouseId: item.warehouseId,
      name: item.name,
      contactName: item.contactName,
      email: item.email,
      phone: item.phone,
      addressLine1: item.addressLine1,
      addressLine2: item.addressLine2,
      city: item.city,
      stateId: item.stateId,
      countryId: item.countryId,
      pinCode: item.pinCode,
      latitude: item.latitude != null ? Number(item.latitude) : undefined,
      longitude: item.longitude != null ? Number(item.longitude) : undefined,
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
      state: item.state
        ? {
            stateId: item.state.stateId,
            state: item.state.state,
            code: item.state.code,
          }
        : undefined,
      country: item.country
        ? {
            countryId: item.country.countryId,
            country: item.country.country,
            countryCode: item.country.countryCode,
          }
        : undefined,
    };
  }

  public async fetchById(id: number): Promise<IWarehouse> {
    const find = await this.warehouseRepository.scope('details').findOne({
      where: { warehouseId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Warehouse not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageWarehouse, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      name: obj.name,
      contactName: obj.contactName ?? null,
      email: obj.email ?? null,
      phone: obj.phone ?? null,
      addressLine1: obj.addressLine1,
      addressLine2: obj.addressLine2 ?? null,
      city: obj.city,
      stateId: obj.stateId,
      countryId: obj.countryId,
      pinCode: obj.pinCode,
      latitude: obj.latitude ?? null,
      longitude: obj.longitude ?? null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.warehouseRepository.create(createObj as unknown as Record<string, unknown>);
  }

  public async update(
    id: number,
    obj: IManageWarehouse,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.warehouseRepository.findOne({ where: { warehouseId: id } });
    if (!find) {
      throw new NotFoundException('Warehouse not found');
    }
    const updateObj = {
      name: obj.name,
      contactName: obj.contactName ?? null,
      email: obj.email ?? null,
      phone: obj.phone ?? null,
      addressLine1: obj.addressLine1,
      addressLine2: obj.addressLine2 ?? null,
      city: obj.city,
      stateId: obj.stateId,
      countryId: obj.countryId,
      pinCode: obj.pinCode,
      latitude: obj.latitude ?? null,
      longitude: obj.longitude ?? null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.warehouseRepository.update(updateObj as unknown as Record<string, unknown>, {
      where: { warehouseId: id },
    });
  }

  public async delete(id: number): Promise<void> {
    const find = await this.warehouseRepository.findOne({ where: { warehouseId: id } });
    if (!find) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.warehouseRepository.destroy({ where: { warehouseId: id } });
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.warehouseRepository.findOne({ where: { warehouseId: id } });
    if (!find) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.warehouseRepository.update(
      { active, modifiedBy: adminId, modifiedIp: cIp },
      { where: { warehouseId: id } },
    );
  }

  public async getWarehouseDropdownList(): Promise<IDropdownItem[]> {
    const tempList = await this.warehouseRepository.findAll({
      where: { active: true },
      order: [['name', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.warehouseId, label: t.name, selected: false }));
  }
}
