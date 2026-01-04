import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IAddressType, IBasicSearch, IDropdownItem, IManageAddressType, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { MstAddressType } from '../database/models';

@Injectable()
export class AddressTypeService {
  constructor(
    @InjectModel(MstAddressType) private readonly addressTypeRepository: typeof MstAddressType,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IAddressType>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'addressType');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.addressTypeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['addressType', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IAddressType[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IAddressType {
    return <IAddressType>{
      addressTypeId: item.addressTypeId,
      id: item.addressTypeId,
      addressType: item.addressType,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IAddressType> {
    const find = await this.addressTypeRepository.scope('details').findOne({
      where: { addressTypeId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Address type not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageAddressType, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      addressType: obj.addressType,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
    };
    await this.addressTypeRepository.create(createObj as any);
  }

  public async update(id: number, obj: IManageAddressType, cIp: string, adminId: number): Promise<void> {
    const find = await this.addressTypeRepository.findOne({ where: { addressTypeId: id } });
    if (!find) {
      throw new NotFoundException('Address type not found');
    }
    const updateObj = {
      addressType: obj.addressType,
      active: obj.active,
      modifiedBy: adminId,
    };
    await this.addressTypeRepository.update(updateObj, { where: { addressTypeId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.addressTypeRepository.findOne({ where: { addressTypeId: id } });
    if (!find) {
      throw new NotFoundException('Address type not found');
    }
    await this.addressTypeRepository.update({ active, modifiedBy: adminId }, { where: { addressTypeId: id } });
  }

  public async getAddressTypeList(): Promise<IDropdownItem[]> {
    const tempList = await this.addressTypeRepository.findAll<MstAddressType>({
      where: { active: true },
      order: [['addressType', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t) => {
      return <IDropdownItem>{ id: t.addressTypeId, label: t.addressType, selected: false };
    });
  }
}
