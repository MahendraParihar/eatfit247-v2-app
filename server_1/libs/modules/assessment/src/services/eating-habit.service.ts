import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstEatingHabit } from '../models';
import {
  ConfigParam,
  IBasicSearch,
  IDropdownItem,
  IEatingHabit,
  IManageEatingHabit,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class EatingHabitService {
  constructor(
    @InjectModel(MstEatingHabit) private readonly eatingHabitRepository: typeof MstEatingHabit,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IEatingHabit>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'eatingHabit');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.eatingHabitRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['eatingHabit', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IEatingHabit[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IEatingHabit {
    return <IEatingHabit>{
      eatingHabitId: item.eatingHabitId,
      id: item.eatingHabitId,
      eatingHabit: item.eatingHabit,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath
      ),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IEatingHabit> {
    const find = await this.eatingHabitRepository.scope('details').findOne({
      where: { eatingHabitId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Eating habit not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageEatingHabit, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      eatingHabit: obj.eatingHabit,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.eatingHabitRepository.create(createObj);
  }

  public async update(id: number, obj: IManageEatingHabit, cIp: string, adminId: number): Promise<void> {
    const find = await this.eatingHabitRepository.findOne({ where: { eatingHabitId: id } });
    if (!find) {
      throw new NotFoundException('Eating habit not found');
    }
    const updateObj = {
      eatingHabit: obj.eatingHabit,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.eatingHabitRepository.update(updateObj, { where: { eatingHabitId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.eatingHabitRepository.findOne({ where: { eatingHabitId: id } });
    if (!find) {
      throw new NotFoundException('Eating habit not found');
    }
    await this.eatingHabitRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { eatingHabitId: id } });
  }

  public async getEatingHabitList(): Promise<IDropdownItem[]> {
    const tempList = await this.eatingHabitRepository.findAll<MstEatingHabit>({
      where: { active: true },
      order: [['eatingHabit', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.eatingHabitId, label: t.eatingHabit, selected: false }));
  }
}

