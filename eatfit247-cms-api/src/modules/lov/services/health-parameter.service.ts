import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { MstHealthParameter } from '../../../core/database/models/mst-health-parameter.model';
import { CreateHealthParameterDto } from '../dto/health-parameter.dto';
import { IHealthParameter, IHealthParameterUnitMapping } from 'shared-lib';
import { MstHealthParameterUnitMapping } from '../../../core/database/models/mst-health-parameter-unit-mapping.model';
import { HealthParameterUnitService } from './health-parameter-unit.service';
import { IMemberHealthParameter } from 'shared-lib';
import { MstHealthParameterUnit } from '../../../core/database/models/mst-health-parameter-unit.model';
import * as _ from 'lodash';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class HealthParameterService {
  constructor(
    @InjectModel(MstHealthParameter) private readonly healthParameterRepository: typeof MstHealthParameter,
    @InjectModel(MstHealthParameterUnitMapping)
    private readonly healthParameterUnitMappingRepository: typeof MstHealthParameterUnitMapping,
    private healthParameterUnitService: HealthParameterUnitService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IHealthParameter>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'healthParameter');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.healthParameterRepository.findAndCountAll<MstHealthParameter>({
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
      order: [['healthParameter', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IHealthParameter[] = [];
    for (const s of rows) {
      const iEvent: IHealthParameter = {
        id: s.healthParameterId,
        name: s.healthParameter,
        sequence: s.sequence,
        hintText: s.hintText,
        fieldType: s.fieldType,
        requiredField: s.requiredField,
        active: s.active,
        isLength: false,
        imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<IHealthParameter>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IHealthParameter> {
    const find = await this.healthParameterRepository.findOne({
      where: {
        healthParameterId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IHealthParameter>{
      id: find.healthParameterId,
      name: find.healthParameter,
      sequence: find.sequence,
      fieldType: find.fieldType,
      requiredField: find.requiredField,
      hintText: find.hintText,
      active: find.active,
      imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateHealthParameterDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      healthParameter: obj.name,
      sequence: obj.sequence,
      hintText: obj.hintText,
      fieldType: obj.fieldType,
      requiredField: obj.requiredField,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
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
    const find = await this.healthParameterRepository.findOne({
      where: {
        healthParameterId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      healthParameter: obj.name,
      sequence: obj.sequence,
      hintText: obj.hintText,
      fieldType: obj.fieldType,
      requiredField: obj.requiredField,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthParameterRepository.findOne({
      where: {
        healthParameterId: id,
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

  public async getHealthParameterWithUnitMapping(): Promise<IMemberHealthParameter[]> {
    return await this.createDefaultHealthParameterLogs();
  }

  public async createDefaultHealthParameterLogs(): Promise<IMemberHealthParameter[]> {
    const promiseAll = await Promise.all([this.getHealthParameterList(), this.getHealthParameterUnitMappingList()]);
    const parameterList = promiseAll[0];
    const parameterUnitMappingList = promiseAll[1];
    const healthParameterWithUnits: IMemberHealthParameter[] = [];
    for (const s of parameterList) {
      const unitList = _.filter(parameterUnitMappingList, { healthParameterId: s.healthParameterId });
      const defaultOne = _.find(unitList, { defaultSelected: true });
      healthParameterWithUnits.push(<IMemberHealthParameter>{
        healthParameter: s.healthParameter,
        healthParameterId: s.healthParameterId,
        hintText: s.hintText,
        fieldType: s.fieldType,
        requiredField: s.requiredField,
        healthParameterUnitId: defaultOne ? defaultOne.healthParameterUnitId : null,
        healthParameterUnit: defaultOne ? defaultOne.healthParameterUnit : null,
        value: null,
        healthParameterUnitList: unitList ? unitList : [],
      });
    }
    return healthParameterWithUnits;
  }

  private async getHealthParameterList(): Promise<MstHealthParameter[]> {
    return await this.healthParameterRepository.findAll<MstHealthParameter>({
      where: {
        active: true,
      },
      order: [['sequence', 'asc']],
      raw: true,
      nest: true,
    });
  }

  private async getHealthParameterUnitMappingList(): Promise<IHealthParameterUnitMapping[]> {
    const tempList = await this.healthParameterUnitMappingRepository.findAll<MstHealthParameterUnitMapping>({
      include: [
        {
          model: MstHealthParameterUnit,
          required: true,
          as: 'HealthParameterUnitMappingUnit',
          attributes: ['healthParameterUnit'],
        },
      ],
      where: {
        active: true,
      },
      raw: true,
      nest: true,
    });
    const list: IHealthParameterUnitMapping[] = [];
    for (const t of tempList) {
      list.push({
        healthParameterId: t.healthParameterId,
        healthParameterUnitId: t.healthParameterUnitId,
        healthParameterUnit: t['HealthParameterUnitMappingUnit']['healthParameterUnit'],
        defaultSelected: t.defaultSelected,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.healthParameterRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.healthParameterRepository.update(obj, { where: { healthParameterId: id } });
  }
}
