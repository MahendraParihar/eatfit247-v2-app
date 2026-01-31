import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IBasicSearch, IDropdownItem, IManageState, IState, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { MstState } from '../database/models';

@Injectable()
export class StateService {
  constructor(
    @InjectModel(MstState) private readonly stateRepository: typeof MstState,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IState>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'state');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.stateRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['state', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IState[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IState {
    return <IState>{
      stateId: item.stateId,
      id: item.stateId,
      state: item.state,
      code: item.code,
      countryId: item.countryId,
      country: item.country?.country || '',
      taxPercentage: item.taxPercentage ? parseFloat(item.taxPercentage) : 0,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async findByCode(code: string): Promise<IState> {
    const find = await this.stateRepository.scope('details').findOne({
      where: { code: code },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('State not found');
    }
    return this.convertToModel(find);
  }

  public async fetchById(id: number): Promise<IState> {
    const find = await this.stateRepository.scope('details').findOne({
      where: { stateId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('State not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageState, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      state: obj.state,
      code: obj.code,
      countryId: obj.countryId,
      taxPercentage: obj.taxPercentage || 0,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.stateRepository.create(createObj as any);
  }

  public async update(id: number, obj: IManageState, cIp: string, adminId: number): Promise<void> {
    const find = await this.stateRepository.findOne({ where: { stateId: id } });
    if (!find) {
      throw new NotFoundException('State not found');
    }
    const updateObj = {
      state: obj.state,
      code: obj.code,
      countryId: obj.countryId,
      taxPercentage: obj.taxPercentage || 0,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.stateRepository.update(updateObj, { where: { stateId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.stateRepository.findOne({ where: { stateId: id } });
    if (!find) {
      throw new NotFoundException('State not found');
    }
    await this.stateRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { stateId: id } });
  }

  public async getStateList(countryId?: number): Promise<IDropdownItem[]> {
    const whereCondition: any = { active: true };
    if (countryId) {
      whereCondition.countryId = countryId;
    }
    const tempList = await this.stateRepository.findAll<MstState>({
      where: whereCondition,
      order: [['state', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.stateId, label: t.state, selected: false }));
  }
}
