import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstHealthParameterUnit } from '@server/common';
import { ITableList, IBasicSearch, IHealthParameterUnit, IManageHealthParameterUnit, IDropdownItem } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';

@Injectable()
export class HealthParameterUnitService {
  constructor(
    @InjectModel(MstHealthParameterUnit) private readonly healthParameterUnitRepository: typeof MstHealthParameterUnit,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IHealthParameterUnit>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'healthParameterUnit');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.healthParameterUnitRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['healthParameterUnit', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IHealthParameterUnit[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IHealthParameterUnit {
    return <IHealthParameterUnit>{
      healthParameterUnitId: item.healthParameterUnitId,
      id: item.healthParameterUnitId,
      healthParameterUnit: item.healthParameterUnit,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IHealthParameterUnit> {
    const find = await this.healthParameterUnitRepository.scope('details').findOne({
      where: { healthParameterUnitId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Health Parameter Unit not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageHealthParameterUnit, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      healthParameterUnit: obj.healthParameterUnit,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.healthParameterUnitRepository.create(createObj);
  }

  public async update(id: number, obj: IManageHealthParameterUnit, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthParameterUnitRepository.findOne({
      where: { healthParameterUnitId: id },
    });
    if (!find) {
      throw new NotFoundException('Health Parameter Unit not found');
    }
    const updateObj = {
      healthParameterUnit: obj.healthParameterUnit,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.healthParameterUnitRepository.update(updateObj, { where: { healthParameterUnitId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthParameterUnitRepository.findOne({
      where: { healthParameterUnitId: id },
    });
    if (!find) {
      throw new NotFoundException('Health Parameter Unit not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.healthParameterUnitRepository.update(updateObj, { where: { healthParameterUnitId: id } });
  }

  public async getHealthParameterUnitList(): Promise<IDropdownItem[]> {
    const tempList = await this.healthParameterUnitRepository.findAll<MstHealthParameterUnit>({
      where: { active: true },
      order: [['healthParameterUnit', 'ASC']],
    });
    return tempList.map((t) => ({
      id: t.healthParameterUnitId,
      label: t.healthParameterUnit,
      selected: false,
    }));
  }
}
