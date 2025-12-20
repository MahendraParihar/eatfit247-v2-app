import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { CreateHealthParameterDto } from '../dto/health-parameter.dto';
import { MstHealthParameterUnit } from '../../../core/database/models/mst-health-parameter-unit.model';
import { IHealthParameterUnit } from 'shared-lib';
import { IDropdownItem } from 'shared-lib';

@Injectable()
export class HealthParameterUnitService {
  constructor(
    @InjectModel(MstHealthParameterUnit) private readonly healthParameterUnitRepository: typeof MstHealthParameterUnit,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IHealthParameterUnit>> {
    const whereCondition: any = {};
    if (searchDto.name) {
      whereCondition['healthParameterUnit'] = searchDto.name;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.healthParameterUnitRepository.findAndCountAll<MstHealthParameterUnit>({
      include: [
        {
          model: MstAdminUser,
          required: false,
          as: 'CreatedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'ModifiedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
      ],
      where: whereCondition,
      order: [['healthParameterUnit', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IHealthParameterUnit[] = [];
    for (const s of rows) {
      const iEvent: IHealthParameterUnit = {
        id: s.healthParameterUnitId,
        name: s.healthParameterUnit,
        active: s.active,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<IHealthParameterUnit>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IHealthParameterUnit> {
    const find = await this.healthParameterUnitRepository.findOne({
      where: {
        healthParameterUnitId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IHealthParameterUnit>{
      id: find.healthParameterUnitId,
      name: find.healthParameterUnit,
      active: find.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateHealthParameterDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      healthParameterUnit: obj.name,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(
    id: number,
    obj: CreateHealthParameterDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.healthParameterUnitRepository.findOne({
      where: {
        healthParameterUnitId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      healthParameterUnit: obj.name,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthParameterUnitRepository.findOne({
      where: {
        healthParameterUnitId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async getHealthParameterUnitList(): Promise<IDropdownItem[]> {
    const tempList = await this.healthParameterUnitRepository.findAll<MstHealthParameterUnit>({
      where: {
        active: true,
      },
      order: [['sequence', 'asc']],
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.healthParameterUnitId,
        label: t.healthParameterUnit,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.healthParameterUnitRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.healthParameterUnitRepository.update(obj, { where: { healthParameterUnitId: id } });
  }
}
